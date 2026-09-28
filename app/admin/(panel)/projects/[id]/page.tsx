import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Mail, MessageSquareText } from "lucide-react";
import { DeleteProjectButton, ProjectForm } from "@/components/ProjectForm";
import { inManila, requireAdmin } from "@/lib/admin";
import { peso, stageLabels } from "@/lib/client-projects";
import { getProject } from "@/lib/client-projects-db";

const side =
  "inline-flex w-full items-center justify-between gap-2 rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-navy/40";

export default async function ProjectPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const project = Number.isSafeInteger(id) ? await getProject(id) : null;
  if (!project) notFound();
  const { saved } = await searchParams;
  const { id: _id, created_at: _created, updated_at: _updated, ...values } = project;
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
