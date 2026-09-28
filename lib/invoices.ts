// Invoices: validation, numbering, totals, and the email a client receives (the PDF is attached).
// Keep this file free of imports so `npm test` can load it directly with Node.

export type InvoiceItem = { description: string; amount: number };

export type InvoiceInput = {
  client_name: string;
  client_email: string;
  client_company: string;
  items: InvoiceItem[];
  issue_date: string;
  due_date: string;
  notes: string;
};

export const invoiceNumber = (seq: number) => `ALVN-${String(seq).padStart(4, "0")}`;
export const invoiceTotal = (items: InvoiceItem[]) => items.reduce((sum, i) => sum + i.amount, 0);
export const php = (amount: number) => `PHP ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export function parseInvoice(form: FormData): InvoiceInput | { error: string } {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const date = (key: string) => {
    const value = get(key);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : "";
  };
  const descriptions = form.getAll("item_description").map((v) => String(v).replace(/\s+/g, " ").trim());
  const amounts = form.getAll("item_amount").map((v) => String(v).replace(/[₱,\s]|PHP/gi, ""));
  const rows = descriptions.map((description, i) => ({ description, amount: amounts[i] ?? "" })).filter((r) => r.description || r.amount);

  const inv = {
    client_name: get("client_name").replace(/\s+/g, " "),
    client_email: get("client_email"),
    client_company: get("client_company").replace(/\s+/g, " "),
    issue_date: date("issue_date"),
    due_date: date("due_date"),
    notes: get("notes"),
  };
  if (!inv.client_name || inv.client_name.length > 120) return { error: "Please enter the client’s name." };
  if (inv.client_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.client_email)) return { error: "Please enter the client’s email: the invoice goes there." };
  if (inv.client_company.length > 160) return { error: "Please shorten the company name." };
  if (!rows.length) return { error: "Please add at least one line item." };
  if (rows.length > 20) return { error: "An invoice can have up to 20 lines." };
  for (const r of rows) {
    if (!r.description || r.description.length > 200) return { error: "Each line needs a short description." };
    if (!/^\d{1,9}$/.test(r.amount) || Number(r.amount) < 1) return { error: `Please enter the amount for “${r.description}” in whole pesos.` };
  }
  if (!inv.issue_date || !inv.due_date) return { error: "Please set the issue and due dates." };
  if (inv.due_date < inv.issue_date) return { error: "The due date can’t be before the issue date." };
  if (inv.notes.length > 2000) return { error: "Please keep the payment details under 2,000 characters." };
  return { ...inv, items: rows.map((r) => ({ description: r.description, amount: Number(r.amount) })) };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Sendable = InvoiceInput & { number: string; total: number };

export function invoiceEmail(inv: Sendable, siteUrl: string, reminder = false) {
  const first = inv.client_name.split(" ")[0];
  const due = longDate(inv.due_date);
  const subject = `${reminder ? "Reminder: " : ""}Invoice ${inv.number}: ${php(inv.total)} due ${due}`;
  const intro = reminder
    ? `Just a friendly reminder about invoice ${inv.number}, due ${due}. The invoice is attached again for convenience.`
    : `Here’s invoice ${inv.number}, due ${due}. The PDF is attached for your records.`;
  const text = [
    `Hi ${first},`,
    "",
    intro,
    "",
    ...inv.items.map((i) => `- ${i.description}: ${php(i.amount)}`),
    `Total due: ${php(inv.total)}`,
    ...(inv.notes ? ["", "How to pay:", inv.notes] : []),
    "",
    "Questions? Just reply to this email.",
    "",
    "Thank you,",
    "Leou",
    `ALVN — Built by Leou · ${siteUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F3EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#071A2D">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px"><img src="${esc(siteUrl)}/brand/alvn-wordmark.png" width="112" height="33" alt="ALVN" style="display:block;border:0"></td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(7,26,45,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="background:#071A2D;padding:28px 32px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#F47721">${reminder ? "Payment reminder" : "Invoice"} · ${esc(inv.number)}</div>
      <div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:700;color:#F7F3EA">${esc(php(inv.total))}</div>
      <div style="margin-top:6px;font-size:15px;color:#CFCCC4">Due ${esc(due)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px 32px">
      <p style="margin:0;font-size:16px;line-height:1.6">Hi ${esc(first)},</p>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.6">${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;font-size:15px;line-height:1.5">
        ${inv.items.map((i) => `<tr><td style="padding:9px 0;border-bottom:1px solid rgba(7,26,45,0.1)">${esc(i.description)}</td><td align="right" style="padding:9px 0 9px 16px;border-bottom:1px solid rgba(7,26,45,0.1);white-space:nowrap">${esc(php(i.amount))}</td></tr>`).join("\n        ")}
        <tr><td style="padding:12px 0 0;font-weight:700">Total due</td><td align="right" style="padding:12px 0 0 16px;font-weight:700;white-space:nowrap">${esc(php(inv.total))}</td></tr>
      </table>
      ${
        inv.notes
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#F7F3EA;border-radius:14px"><tr><td style="padding:18px 20px">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#5F6B7E">How to pay</div>
        <div style="margin-top:8px;font-size:15px;line-height:1.6">${esc(inv.notes).replace(/\n/g, "<br>")}</div>
      </td></tr></table>`
          : ""
      }
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#5F6B7E">Questions? Just reply to this email.</p>
      <p style="margin:20px 0 0;font-size:16px;line-height:1.6">Thank you,<br><strong>Leou</strong></p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#5F6B7E">ALVN — Built by Leou · <a href="${esc(siteUrl)}" style="color:#5F6B7E">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
