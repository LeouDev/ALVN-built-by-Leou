import type { ContractStatus } from "@/lib/contracts-db";

const styles: Record<ContractStatus, string> = {
  draft: "bg-navy/[0.06] text-navy/70",
  sent: "bg-accent/10 text-navy",
  signed: "bg-[#067647]/12 text-[#067647]",
  void: "bg-navy/[0.06] text-navy/50 line-through",
};

export function StatusPill({ status, viewed }: { status: ContractStatus; viewed?: boolean }) {
  const label = status === "sent" ? (viewed ? "Opened" : "Sent") : status === "draft" ? "Draft" : status === "signed" ? "Signed" : "Void";
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{label}</span>;
}

const invoiceStyles = {
  draft: "bg-navy/[0.06] text-navy/70",
  sent: "bg-accent/10 text-navy",
  overdue: "bg-[#b42318]/10 text-[#b42318]",
  paid: "bg-[#067647]/12 text-[#067647]",
  void: "bg-navy/[0.06] text-navy/50 line-through",
} as const;

/** Draft · Sent · Overdue (sent and past due) · Paid · Void */
export function InvoicePill({ status, overdue }: { status: keyof typeof invoiceStyles; overdue?: boolean }) {
  const key = status === "sent" && overdue ? "overdue" : status;
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${invoiceStyles[key]}`}>{key}</span>;
}
