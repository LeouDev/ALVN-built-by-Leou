import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { deleteInvoiceDraft, markPaidAction, sendInvoice, voidInvoiceAction } from "@/app/admin/invoice-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InvoicePill } from "@/components/ContractStatus";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Toast } from "@/components/Toast";
import { inManila, requireAdmin, todayInManila } from "@/lib/admin";
import { provider } from "@/lib/contracts-db";
import { longDate, php } from "@/lib/invoices";
import { getInvoice, paymentQrVersion } from "@/lib/invoices-db";

const plainButton = "w-full rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-navy/40";
const at = (d: Date | null) => (d ? inManila(d, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");

const notices: Record<string, [string, "success" | "error"]> = {
  saved: ["Draft saved.", "success"],
  sent: ["Invoice sent, with the PDF attached.", "success"],
  reminded: ["Reminder sent, with the invoice attached again.", "success"],
  paid: ["Marked as paid.", "success"],
  failed: ["The invoice couldn’t be sent. Google can be slow for a minute after the script is updated, so try again shortly.", "error"],
};

export default async function InvoicePage({ params, searchParams }: PageProps<"/admin/invoices/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const inv = Number.isSafeInteger(id) ? await getInvoice(id) : null;
  if (!inv) notFound();
  const qrVersion = await paymentQrVersion();
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? notices[query.notice] : undefined;
  const p = provider();
  const overdue = inv.status === "sent" && inv.due_date < todayInManila();
  const first = inv.client_name.split(" ")[0];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {notice && <Toast key={String(query.t)} message={notice[0]} tone={notice[1]} />}
      <div className="lg:col-span-8">
        <Link href={inv.project_id ? `/admin/projects/${inv.project_id}` : "/admin/invoices"} className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
          <ArrowLeft aria-hidden className="size-4" /> {inv.project_id ? "Project" : "Invoices"}
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="headline text-[clamp(2rem,4vw,3rem)]">{inv.number}</h1>
          <InvoicePill status={inv.status} overdue={overdue} />
        </div>
        <p className="mt-2 text-muted">
          {php(inv.total)} · for {inv.client_name} · due {longDate(inv.due_date)}
        </p>

        <article className="mt-8 rounded-[28px] border border-line bg-white p-7 shadow-[0_24px_60px_-40px_rgba(14,14,14,0.35)] sm:p-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-accent">Billing statement</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{inv.number}</h2>
            </div>
            {inv.status === "paid" && <span className="rounded-lg border-2 border-[#067647] px-3 py-1 text-sm font-bold tracking-widest text-[#067647]">PAID</span>}
            {inv.status === "void" && <span className="rounded-lg border-2 border-[#b42318] px-3 py-1 text-sm font-bold tracking-widest text-[#b42318]">VOID</span>}
          </div>
          <div className="mt-8 grid gap-6 text-sm sm:grid-cols-3">
            <div>
              <p className="eyebrow">Billed to</p>
              <p className="mt-2 font-semibold">{inv.client_name}</p>
              {inv.client_company && <p>{inv.client_company}</p>}
              <p className="text-muted">{inv.client_email}</p>
            </div>
            <div>
              <p className="eyebrow">From</p>
              <p className="mt-2 font-semibold">{p.business}</p>
              <p>{p.name}</p>
              <p className="text-muted">{p.address}</p>
            </div>
            <div>
              <p className="eyebrow">Issued</p>
              <p className="mt-2">{longDate(inv.issue_date)}</p>
              <p className="eyebrow mt-3">Due</p>
              <p className="mt-2 font-semibold">{longDate(inv.due_date)}</p>
            </div>
          </div>
          <table className="mt-8 w-full text-[15px]">
            <thead>
              <tr className="border-b border-navy text-left">
                <th className="pb-2">
                  <span className="eyebrow">Description</span>
                </th>
                <th className="pb-2 text-right">
                  <span className="eyebrow">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-3 pr-4">{item.description}</td>
                  <td className="py-3 text-right whitespace-nowrap tabular-nums">{php(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <p className="flex w-full max-w-xs justify-between rounded-2xl bg-cream/80 px-5 py-4 font-semibold sm:w-auto sm:gap-12">
              <span>{inv.status === "paid" ? "Total paid" : "Total due"}</span>
              <span className="tabular-nums">{php(inv.total)}</span>
            </p>
          </div>
          {(inv.notes || qrVersion) && (
            <div className="mt-8 flex flex-wrap items-start gap-6 border-l-[3px] border-accent pl-4">
              <div className="min-w-0 flex-1 basis-56">
                <p className="eyebrow">How to pay</p>
                {inv.notes && <p className="mt-2 text-sm whitespace-pre-wrap">{inv.notes}</p>}
                {qrVersion && <p className="mt-2 text-sm text-muted">{inv.notes ? "Or scan" : "Scan"} the QR code with your bank or e-wallet app.</p>}
              </div>
              {qrVersion && <img src={`/admin/invoices/payment-qr?v=${qrVersion}`} alt="Payment QR code" className="h-44 w-36 object-contain object-top" />}
            </div>
          )}
        </article>

        {inv.status === "draft" && (
          <details className="mt-8 rounded-[28px] border border-line bg-white/45">
            <summary className="cursor-pointer list-none px-7 py-5 font-semibold">Edit the invoice</summary>
            <div className="px-2 pb-2 sm:px-4 sm:pb-4">
              <InvoiceForm projectId={inv.project_id} id={inv.id} initial={inv} shortcuts={[]} />
            </div>
          </details>
        )}
      </div>

      <aside className="space-y-4 lg:col-span-4 lg:pt-12">
        <ol className="space-y-3 rounded-[22px] border border-line bg-white/60 p-6 text-sm">
          <li>
            <span className="font-semibold">Created</span> <span className="block text-xs text-muted">{at(inv.created_at)}</span>
          </li>
          <li>
            <span className={`font-semibold ${inv.sent_at ? "" : "text-muted"}`}>Sent to {inv.client_email}</span>
            {inv.sent_at && <span className="block text-xs text-muted">{at(inv.sent_at)}</span>}
          </li>
          <li>
            <span className={`font-semibold ${inv.paid_at ? "" : "text-muted"}`}>Paid</span>
            {inv.paid_at && <span className="block text-xs text-muted">{at(inv.paid_at)}</span>}
          </li>
        </ol>

        {(inv.status === "draft" || inv.status === "sent") && (
          <ConfirmButton
            action={sendInvoice.bind(null, inv.id)}
            label={inv.status === "sent" ? "Send a reminder" : "Send invoice"}
            title={inv.status === "sent" ? `Send ${first} a reminder?` : `Send ${inv.number} to ${first}?`}
            message={`${inv.status === "sent" ? "A friendly reminder with the invoice attached again" : `The billing statement for ${php(inv.total)}, with its PDF attached,`} goes to ${inv.client_email} from your Gmail.`}
            confirmLabel={inv.status === "sent" ? "Send reminder" : "Send invoice"}
            pendingLabel="Sending…"
            className="w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent/85"
          />
        )}
        {inv.status === "sent" && (
          <ConfirmButton
            action={markPaidAction.bind(null, inv.id)}
            label="Mark as paid"
            title={`Mark ${inv.number} as paid?`}
            message={`${php(inv.total)} is recorded as received${inv.project_id ? " and added to the project’s paid amount" : ""}.`}
            confirmLabel="Mark as paid"
            pendingLabel="Saving…"
            className={plainButton}
          />
        )}
        <a href={`/admin/invoices/${inv.id}/pdf`} target="_blank" className={`${plainButton} inline-flex items-center justify-center gap-2`}>
          <Download aria-hidden className="size-4" /> {inv.status === "draft" ? "Preview PDF" : "Download PDF"}
        </a>
        {inv.status === "sent" && (
          <ConfirmButton
            action={voidInvoiceAction.bind(null, inv.id)}
            label="Void invoice"
            title={`Void ${inv.number}?`}
            message="It stays in your records as void and can’t be sent or paid. This can’t be undone."
            confirmLabel="Void invoice"
            pendingLabel="Voiding…"
            danger
            className={`${plainButton} text-[#b42318]`}
          />
        )}
        {inv.status === "draft" && (
          <ConfirmButton
            action={deleteInvoiceDraft.bind(null, inv.id)}
            label="Delete draft"
            title="Delete this draft?"
            message={`${inv.number} is removed for good.`}
            confirmLabel="Delete draft"
            pendingLabel="Deleting…"
            danger
            className={`${plainButton} text-[#b42318]`}
          />
        )}
        {inv.status === "void" && <p className="text-sm text-muted">This invoice was voided.</p>}
      </aside>
    </div>
  );
}
