import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm, type ProjectValues } from "@/components/ProjectForm";
import { requireAdmin } from "@/lib/admin";
import { getMessage, type Message } from "@/lib/inbox";
import { PROJECT_TYPES } from "@/lib/inquiry";

/** Pre-fills a new project from an inbox message ("Create project" on an inquiry or booked call). */
function fromMessage(m: Message): ProjectValues {
  const inquiry = m.kind === "inquiry";
  const who = m.details.company || m.name;
  const context = [m.details.budget && `Budget range: ${m.details.budget}`, m.details.timeline && `Timeline: ${m.details.timeline}`]
    .filter(Boolean)
    .join("\n");
  return {
    name: inquiry ? `${m.subject} for ${who}` : `Project for ${who}`,
    client_name: m.name,
    client_email: m.email,
    company: m.details.company ?? "",
    type: inquiry && (PROJECT_TYPES as readonly string[]).includes(m.subject) ? m.subject : "",
    stage: "lead",
    notes: [context, m.body].filter(Boolean).join("\n\n"),
    message_id: m.id,
  };
}

export default async function NewProject({ searchParams }: PageProps<"/admin/projects/new">) {
  await requireAdmin();
  const { from } = await searchParams;
  const message = typeof from === "string" && /^\d+$/.test(from) ? await getMessage(Number(from)) : null;

  return (
    <div className="max-w-3xl">
      <Link href={message ? `/admin/messages/${message.id}` : "/admin/projects"} className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
        <ArrowLeft aria-hidden className="size-4" /> {message ? message.name : "Projects"}
      </Link>
      <h1 className="headline mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)]">New project</h1>
      {message && <p className="mt-3 text-muted">Filled in from {message.name}’s {message.kind === "inquiry" ? "inquiry" : "call booking"}. Adjust anything before saving.</p>}
      <div className="mt-8">
        <ProjectForm id={null} initial={message ? fromMessage(message) : { stage: "lead" }} />
      </div>
    </div>
  );
}
