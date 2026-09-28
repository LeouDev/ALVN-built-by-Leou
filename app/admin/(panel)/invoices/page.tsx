import Link from "next/link";
import { InvoicePill } from "@/components/ContractStatus";
import { requireAdmin, todayInManila } from "@/lib/admin";
import { longDate, php } from "@/lib/invoices";
import { listInvoices } from "@/lib/invoices-db";

export default async function Invoices() {
  await requireAdmin();
  const invoices = await listInvoices();
  const today = todayInManila();
  const open = invoices.filter((i) => i.status === "sent");
  const overdue = open.filter((i) => i.due_date < today);
  const stats = [
    ["Outstanding", php(open.reduce((s, i) => s + i.total, 0))],
    ["Overdue", php(overdue.reduce((s, i) => s + i.total, 0))],
    ["Paid", php(invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0))],
  ];

  return (
    <>
      <h1 className="headline text-[clamp(2.5rem,5vw,3.5rem)]">Invoices</h1>
      <p className="mt-3 max-w-xl text-muted">Create an invoice from a project: open the project and choose “New invoice”.</p>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-line bg-white/60 px-6 py-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tracking-tight ${label === "Overdue" && overdue.length ? "text-[#b42318]" : ""}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {invoices.length === 0 ? (
        <p className="mt-10 rounded-[28px] border border-line bg-white/60 px-7 py-16 text-center text-muted">No invoices yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white/60">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/invoices/${i.id}`} className="grid gap-x-6 gap-y-1 px-6 py-5 transition-colors hover:bg-white sm:grid-cols-[1fr_auto_auto_9rem] sm:items-center sm:px-7">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {i.number} · {i.client_name}
                  </span>
                  <span className="block truncate text-sm text-muted">{i.project_name ?? i.items[0]?.description}</span>
                </span>
                <span className="font-semibold tabular-nums">{php(i.total)}</span>
                <InvoicePill status={i.status} overdue={i.due_date < today} />
                <span className="text-sm text-muted sm:text-right">Due {longDate(i.due_date).replace(/, \d{4}$/, "")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
