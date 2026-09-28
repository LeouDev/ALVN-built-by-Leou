import Link from "next/link";
import { inManila, requireAdmin } from "@/lib/admin";
import { listContracts } from "@/lib/contracts-db";
import { StatusPill } from "@/components/ContractStatus";

export default async function Contracts() {
  await requireAdmin();
  const contracts = await listContracts();

  return (
    <>
      <h1 className="headline text-[clamp(2.5rem,5vw,3.5rem)]">Contracts</h1>
      <p className="mt-3 max-w-xl text-muted">Start a contract from a project: open the project and choose “New contract”.</p>

      {contracts.length === 0 ? (
        <p className="mt-10 rounded-[28px] border border-line bg-white/60 px-7 py-16 text-center text-muted">No contracts yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white/60">
          {contracts.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/contracts/${c.id}`} className="grid gap-x-6 gap-y-1 px-6 py-5 transition-colors hover:bg-white sm:grid-cols-[1fr_auto_8rem] sm:items-center sm:px-7">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.title}</span>
                  <span className="block truncate text-sm text-muted">{[c.client_name, c.project_name].filter(Boolean).join(" · ")}</span>
                </span>
                <StatusPill status={c.status} viewed={Boolean(c.viewed_at)} />
                <span className="text-sm text-muted sm:text-right">
                  {inManila(c.client_signed_at ?? c.sent_at ?? c.created_at, { month: "short", day: "numeric" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
