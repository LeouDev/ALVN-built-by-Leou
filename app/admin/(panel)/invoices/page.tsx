import Link from "next/link";
import { QrCode } from "lucide-react";
import { removePaymentQr } from "@/app/admin/invoice-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InvoicePill } from "@/components/ContractStatus";
import { PaymentQrUpload } from "@/components/PaymentQrUpload";
import { Toast } from "@/components/Toast";
import { requireAdmin, todayInManila } from "@/lib/admin";
import { longDate, php } from "@/lib/invoices";
import { listInvoices, paymentQrVersion } from "@/lib/invoices-db";

const notices: Record<string, [string, "success" | "error"]> = {
  qr: ["Payment QR saved. It’s on every billing statement from now on.", "success"],
  "qr-removed": ["Payment QR removed.", "success"],
  "qr-failed": ["That image couldn’t be saved. Try a screenshot cropped to just the QR code.", "error"],
};

export default async function Invoices({ searchParams }: PageProps<"/admin/invoices">) {
  await requireAdmin();
  const invoices = await listInvoices();
  const qrVersion = await paymentQrVersion();
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? notices[query.notice] : undefined;
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
      {notice && <Toast key={String(query.t)} message={notice[0]} tone={notice[1]} />}
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

      <section className="mt-3 flex flex-wrap items-center gap-5 rounded-[22px] border border-line bg-white/60 px-6 py-5">
        {qrVersion ? (
          <img src={`/admin/invoices/payment-qr?v=${qrVersion}`} alt="Your payment QR code" className="size-20 rounded-xl border border-line bg-white object-contain p-1" />
        ) : (
          <span className="grid size-20 place-items-center rounded-xl border border-dashed border-navy/20 text-navy/35">
            <QrCode aria-hidden className="size-8" />
          </span>
        )}
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="font-semibold">Payment QR code</h2>
          <p className="mt-1 text-sm text-muted">
            {qrVersion
              ? "Printed on every billing statement, beside How to pay."
              : "Add your bank’s or e-wallet’s QR code and it’s printed on every billing statement. Crop it to just the QR for the sharpest scan."}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <PaymentQrUpload label={qrVersion ? "Replace" : "Upload QR"} />
          {qrVersion && (
            <ConfirmButton
              action={removePaymentQr}
              label="Remove"
              title="Remove your payment QR?"
              message="Billing statements you send from now on won’t show a QR code."
              confirmLabel="Remove QR"
              pendingLabel="Removing…"
              danger
              className="rounded-full border border-line bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#b42318] hover:border-navy/40"
            />
          )}
        </div>
      </section>

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
