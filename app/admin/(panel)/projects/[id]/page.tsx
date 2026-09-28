import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FilePlus2, Mail, MessageSquareText, ReceiptText } from "lucide-react";
import { InvoicePill, StatusPill } from "@/components/ContractStatus";
import { DeleteProjectButton, ProjectForm } from "@/components/ProjectForm";
import { inManila, requireAdmin, todayInManila } from "@/lib/admin";
import { peso, stageLabels } from "@/lib/client-projects";
import { getProject } from "@/lib/client-projects-db";
import { listContracts } from "@/lib/contracts-db";
import { php } from "@/lib/invoices";
import { listInvoices } from "@/lib/invoices-db";

const side =
  "inline-flex w-full items-center justify-between gap-2 rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-navy/40";

export default async function ProjectPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const project = Number.isSafeInteger(id) ? await getProject(id) : null;
  if (!project) notFound();
  const { saved } = await searchParams;
  const { id: _id, created_at: _created, updated_at: _updated, ...values } = project;
  const contracts = await listContracts(project.id);
  const invoices = await listInvoices(project.id);
  const today = todayInManila();
  const balance = project.budget != null ? project.budget - project.paid : null;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
          <ArrowLeft aria-hidden className="size-4" /> Projects
        </Link>
        <h1 className="headline mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)]">{project.name}</h1>
        <p className="mt-3 text-muted">
          {stageLabels[project.stage]} · {project.client_name} · updated {inManila(project.updated_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
        {saved && (
          <p role="status" className="mt-4 text-sm font-semibold text-[#067647]">
            Saved.
          </p>
        )}
        <div className="mt-8">
          <ProjectForm id={project.id} initial={values} />
        </div>
      </div>

      <aside className="space-y-3 lg:col-span-4 lg:pt-12">
        {balance != null && (
          <div className="mb-6 rounded-[22px] border border-line bg-white/60 px-6 py-5">
            <p className="text-sm text-muted">{balance > 0 ? "Still to collect" : "Fully paid"}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{peso(Math.max(balance, 0))}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/10" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${project.budget ? Math.min(100, (project.paid / project.budget) * 100) : 0}%` }} />
            </div>
          </div>
        )}
        <div className="mb-6 rounded-[22px] border border-line bg-white/60 p-5">
          <p className="eyebrow">Contracts</p>
          {contracts.length > 0 && (
            <ul className="mt-3 space-y-2">
              {contracts.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/contracts/${c.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold hover:bg-white">
                    <span className="truncate">{c.title}</span>
                    <StatusPill status={c.status} viewed={Boolean(c.viewed_at)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/admin/contracts/new?project=${project.id}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-cream hover:bg-navy-soft"
          >
            <FilePlus2 aria-hidden className="size-4" /> New contract
          </Link>
        </div>
        <div className="mb-6 rounded-[22px] border border-line bg-white/60 p-5">
          <p className="eyebrow">Invoices</p>
          {invoices.length > 0 && (
            <ul className="mt-3 space-y-2">
              {invoices.map((i) => (
                <li key={i.id}>
                  <Link href={`/admin/invoices/${i.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold hover:bg-white">
                    <span className="truncate">
                      {i.number} · {php(i.total)}
                    </span>
                    <InvoicePill status={i.status} overdue={i.due_date < today} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/admin/invoices/new?project=${project.id}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-cream hover:bg-navy-soft"
          >
            <ReceiptText aria-hidden className="size-4" /> New invoice
          </Link>
        </div>
        {project.message_id && (
          <Link href={`/admin/messages/${project.message_id}`} className={side}>
            Original message <MessageSquareText aria-hidden className="size-4" />
          </Link>
        )}
        {project.client_email && (
          <a href={`mailto:${project.client_email}`} className={side}>
            Email {project.client_name.split(" ")[0]} <Mail aria-hidden className="size-4" />
          </a>
        )}
        {project.live_url && (
          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={side}>
            Live site <ArrowUpRight aria-hidden className="size-4" />
          </a>
        )}
        {project.repo_url && (
          <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className={side}>
            Repository <ArrowUpRight aria-hidden className="size-4" />
          </a>
        )}
        <div className="pt-6">
          <DeleteProjectButton id={project.id} />
        </div>
      </aside>
    </div>
  );
}
