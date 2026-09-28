import { sql } from "@/lib/db";
import { invoiceNumber, invoiceTotal, type InvoiceInput, type InvoiceItem } from "@/lib/invoices";

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export type Invoice = InvoiceInput & {
  id: number;
  seq: number;
  number: string;
  project_id: number | null;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  sent_at: Date | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

// Dates come back as "YYYY-MM-DD" text, like the projects table.
const columns = sql`id, seq, number, project_id, client_name, client_email, client_company, items, total,
  issue_date::text, due_date::text, notes, status, sent_at, paid_at, created_at, updated_at`;

export async function listInvoices(projectId?: number) {
  return sql<(Invoice & { project_name: string | null })[]>`
    select ${columns}, (select name from alvn.projects p where p.id = i.project_id) as project_name
    from alvn.invoices i
    where ${projectId ?? null}::bigint is null or project_id = ${projectId ?? null}
    order by seq desc`;
}

export async function getInvoice(id: number) {
  const [inv] = await sql<Invoice[]>`select ${columns} from alvn.invoices where id = ${id}`;
  return inv ?? null;
}

/** The payment details from the most recent invoice, to pre-fill the next one. */
export async function lastNotes() {
  const [row] = await sql<{ notes: string }[]>`select notes from alvn.invoices where notes <> '' order by seq desc limit 1`;
  return row?.notes ?? "";
}

export async function createInvoice(projectId: number | null, inv: InvoiceInput) {
  const [row] = await sql<{ id: number }[]>`
    with next as (select coalesce(max(seq), 0) + 1 as seq from alvn.invoices)
    insert into alvn.invoices (seq, number, project_id, client_name, client_email, client_company, items, total, issue_date, due_date, notes)
    select next.seq, 'ALVN-' || lpad(next.seq::text, 4, '0'), ${projectId}, ${inv.client_name}, ${inv.client_email}, ${inv.client_company},
           ${inv.items as never}::jsonb, ${invoiceTotal(inv.items)}, ${inv.issue_date}, ${inv.due_date}, ${inv.notes}
    from next
    returning id`;
  return row.id;
}

/** Drafts only: once sent, an invoice isn't edited (void it and make a new one). */
export async function updateDraft(id: number, inv: InvoiceInput) {
  await sql`
    update alvn.invoices set client_name = ${inv.client_name}, client_email = ${inv.client_email}, client_company = ${inv.client_company},
      items = ${inv.items as never}::jsonb, total = ${invoiceTotal(inv.items)}, issue_date = ${inv.issue_date}, due_date = ${inv.due_date},
      notes = ${inv.notes}, updated_at = now()
    where id = ${id} and status = 'draft'`;
}

export async function markSent(id: number) {
  await sql`update alvn.invoices set status = 'sent', sent_at = coalesce(sent_at, now()), updated_at = now() where id = ${id} and status in ('draft', 'sent')`;
}

/** Paid: the amount is added to the project's "paid so far", once. */
/** One statement, so the invoice and the project's paid amount change together (and only once). */
export async function markPaid(id: number) {
  const [row] = await sql<{ n: number }[]>`
    with inv as (
      update alvn.invoices set status = 'paid', paid_at = now(), updated_at = now()
      where id = ${id} and status in ('draft', 'sent') returning project_id, total
    ), project as (
      update alvn.projects p set paid = p.paid + inv.total, updated_at = now() from inv where p.id = inv.project_id returning p.id
    )
    select count(*)::int as n from inv`;
  return row.n > 0;
}

export async function voidInvoice(id: number) {
  await sql`update alvn.invoices set status = 'void', updated_at = now() where id = ${id} and status in ('draft', 'sent')`;
}

export async function deleteDraft(id: number) {
  await sql`delete from alvn.invoices where id = ${id} and status = 'draft'`;
}

export { invoiceNumber };

/** When the payment QR was last uploaded (null if there isn't one), for cache-busting its URL. */
export async function paymentQrVersion() {
  const [row] = await sql<{ updated_at: Date }[]>`select updated_at from alvn.assets where name = 'payment_qr'`;
  return row?.updated_at.getTime() ?? null;
}

/** The bank QR printed on billing statements, as PNG bytes. */
export async function getPaymentQr() {
  const [row] = await sql<{ data: Buffer }[]>`select data from alvn.assets where name = 'payment_qr'`;
  return row?.data ?? null;
}

export async function setPaymentQr(png: Buffer | null) {
  if (!png) await sql`delete from alvn.assets where name = 'payment_qr'`;
  else
    await sql`
      insert into alvn.assets (name, data) values ('payment_qr', ${png})
      on conflict (name) do update set data = excluded.data, updated_at = now()`;
}
