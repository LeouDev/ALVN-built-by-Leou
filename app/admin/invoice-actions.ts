"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { provider } from "@/lib/contracts-db";
import { getProject } from "@/lib/client-projects-db";
import { renderInvoicePdf, renderReceiptPdf } from "@/lib/invoice-pdf";
import { invoiceEmail, manilaDate, parseInvoice, receiptEmail } from "@/lib/invoices";
import { createInvoice, deleteDraft, getInvoice, getPaymentQr, markPaid, markReceiptSent, markSent, setPaymentQr, updateDraft, voidInvoice } from "@/lib/invoices-db";
import { callScript } from "@/lib/script";
import { site } from "@/lib/site";

type FormState = { error: string; values?: Record<string, FormDataEntryValue[]> } | null;

type Notice = "saved" | "sent" | "reminded" | "paid" | "paid-sent" | "paid-unsent" | "receipt-sent" | "receipt-failed" | "failed";
const notice = (id: number, kind: Notice) => `/admin/invoices/${id}?notice=${kind}&t=${Date.now()}`;

/** Creates (id = null) or updates a draft invoice. On a validation error it returns what was submitted. */
export async function saveInvoice(projectId: number | null, id: number | null, _state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const invoice = parseInvoice(form);
  if ("error" in invoice) {
    const values: Record<string, FormDataEntryValue[]> = {};
    for (const key of new Set(form.keys())) values[key] = form.getAll(key);
    return { error: invoice.error, values };
  }
  if (id) await updateDraft(id, invoice);
  redirect(notice(id ?? (await createInvoice(projectId, invoice)), "saved"));
}

/** Emails the invoice with its PDF from Leou's Gmail. Sending again later goes out as a reminder. */
export async function sendInvoice(id: number) {
  await requireAdmin();
  const inv = await getInvoice(id);
  if (!inv || (inv.status !== "draft" && inv.status !== "sent")) redirect(`/admin/invoices/${id}`);
  const reminder = inv.status === "sent";
  const qr = await getPaymentQr();
  const sent = await renderInvoicePdf(inv, provider(), site.url, qr)
    .then((pdf) =>
      callScript<{ ok?: boolean }>({
        action: "send",
        to: inv.client_email,
        ...invoiceEmail(inv, site.url, { reminder, qr: Boolean(qr) }),
        attachments: [{ name: `Billing Statement ${inv.number}.pdf`, base64: pdf.toString("base64") }],
      }),
    )
    .catch((err) => {
      console.error(`[invoices] couldn't send ${inv.number}:`, err);
      return null;
    });
  if (!sent?.ok) redirect(notice(id, "failed"));
  await markSent(id);
  redirect(notice(id, reminder ? "reminded" : "sent"));
}

/** Records the payment; with "notify" ticked in the dialog, also emails the client the acknowledgement receipt. */
export async function markPaidAction(id: number, form: FormData) {
  await requireAdmin();
  const marked = await markPaid(id);
  if (!marked || form.get("notify") !== "on") redirect(notice(id, "paid"));
  redirect(notice(id, (await emailReceipt(id)) ? "paid-sent" : "paid-unsent"));
}

/** Sends (or re-sends) the acknowledgement for an invoice that's already paid. */
export async function sendReceipt(id: number) {
  await requireAdmin();
  redirect(notice(id, (await emailReceipt(id)) ? "receipt-sent" : "receipt-failed"));
}

/** Emails the acknowledgement receipt with its PDF from Leou's Gmail; false if it couldn't be sent. */
async function emailReceipt(id: number) {
  const inv = await getInvoice(id);
  if (inv?.status !== "paid" || !inv.paid_at) return false;
  const project = inv.project_id ? await getProject(inv.project_id) : null;
  const remaining = project?.budget != null ? Math.max(0, project.budget - project.paid) : null;
  const sent = await renderReceiptPdf(inv, provider(), site.url)
    .then((pdf) =>
      callScript<{ ok?: boolean }>({
        action: "send",
        to: inv.client_email,
        ...receiptEmail(inv, manilaDate(new Date(inv.paid_at!)), site.url, { remaining }),
        attachments: [{ name: `Acknowledgement Receipt ${inv.number}.pdf`, base64: pdf.toString("base64") }],
      }),
    )
    .catch((err) => {
      console.error(`[invoices] couldn't send the acknowledgement for ${inv.number}:`, err);
      return null;
    });
  if (!sent?.ok) return false;
  await markReceiptSent(id);
  return true;
}

export async function voidInvoiceAction(id: number) {
  await requireAdmin();
  await voidInvoice(id);
  redirect(`/admin/invoices/${id}`);
}

export async function deleteInvoiceDraft(id: number) {
  await requireAdmin();
  const inv = await getInvoice(id);
  await deleteDraft(id);
  redirect(inv?.project_id ? `/admin/projects/${inv.project_id}` : "/admin/invoices");
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const qrNotice = (kind: "qr" | "qr-removed" | "qr-failed") => `/admin/invoices?notice=${kind}&t=${Date.now()}`;

/** Saves the bank QR printed on billing statements. The browser has already turned it into a small PNG. */
export async function uploadPaymentQr(form: FormData) {
  await requireAdmin();
  const file = form.get("qr");
  const png = file instanceof File && file.size <= 900_000 ? Buffer.from(await file.arrayBuffer()) : null;
  if (!png?.subarray(0, 8).equals(PNG_SIGNATURE)) redirect(qrNotice("qr-failed"));
  await setPaymentQr(png);
  redirect(qrNotice("qr"));
}

export async function removePaymentQr() {
  await requireAdmin();
  await setPaymentQr(null);
  redirect(qrNotice("qr-removed"));
}
