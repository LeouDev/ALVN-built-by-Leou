import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin, todayInManila } from "@/lib/admin";
import { isOpen, peso, STAGES, stageLabels } from "@/lib/client-projects";
import { listProjects, type ClientProject } from "@/lib/client-projects-db";

const day = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function money(p: ClientProject) {
  if (p.budget != null) return `${peso(p.paid)} of ${peso(p.budget)}`;
  return p.paid ? `${peso(p.paid)} paid` : "";
}

export default async function Projects() {
  await requireAdmin();
  const projects = await listProjects();
  const today = todayInManila();
  const open = projects.filter((p) => isOpen(p.stage));
  const stats = [
    ["Open projects", String(open.length)],
    ["Open budget", peso(open.reduce((sum, p) => sum + (p.budget ?? 0), 0))],
    ["Paid on open projects", peso(open.reduce((sum, p) => sum + p.paid, 0))],
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="headline text-[clamp(2.5rem,5vw,3.5rem)]">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-[#ff8a3d]"
        >
          <Plus aria-hidden className="size-4" /> New project
        </Link>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-line bg-white/60 px-6 py-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>

      {projects.length === 0 && (
        <p className="mt-10 rounded-[28px] border border-line bg-white/60 px-7 py-16 text-center text-muted">
          No projects yet. Create one, or start one from an inquiry in your inbox.
        </p>
      )}

      {STAGES.map((stage) => {
        const list = projects.filter((p) => p.stage === stage);
        if (!list.length) return null;
        return (
          <section key={stage} className="mt-12">
            <h2 className="eyebrow">
              {stageLabels[stage]} · {list.length}
            </h2>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white/60">
              {list.map((p) => {
                const overdue = p.due_date && p.due_date < today && isOpen(p.stage);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="grid gap-x-8 gap-y-1 px-6 py-5 transition-colors hover:bg-white sm:grid-cols-[1fr_auto_7rem] sm:items-center sm:px-7"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {[p.client_name, p.company, p.type].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="text-sm tabular-nums">{money(p)}</span>
                      <span className={`text-sm sm:text-right ${overdue ? "font-semibold text-[#b42318]" : "text-muted"}`}>
                        {p.due_date ? `${overdue ? "Overdue · " : "Due "}${day(p.due_date)}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
