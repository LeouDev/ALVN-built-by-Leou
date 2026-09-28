import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContractForm } from "@/components/ContractForm";
import { requireAdmin } from "@/lib/admin";
import { getProject } from "@/lib/client-projects-db";

export default async function NewContract({ searchParams }: PageProps<"/admin/contracts/new">) {
  await requireAdmin();
  const { project: projectParam } = await searchParams;
  const project = typeof projectParam === "string" && /^\d+$/.test(projectParam) ? await getProject(Number(projectParam)) : null;

  return (
    <div className="max-w-3xl">
      <Link href={project ? `/admin/projects/${project.id}` : "/admin/contracts"} className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
        <ArrowLeft aria-hidden className="size-4" /> {project ? project.name : "Contracts"}
      </Link>
      <h1 className="headline mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)]">New contract</h1>
      <p className="mt-3 text-muted">Fill in the terms and create a draft. You’ll review the full text, then sign and send it.</p>
      <div className="mt-8">
        <ContractForm
          projectId={project?.id ?? null}
          id={null}
          initial={{
            title: `${project?.type || "Website"} Development Agreement`,
            client_name: project?.client_name ?? "",
            client_email: project?.client_email ?? "",
            client_company: project?.company ?? "",
            scope: project ? `- ${project.name}` : "",
            price: project?.budget ?? "",
            plan: "50-50",
            start_date: project?.start_date ?? "",
            due_date: project?.due_date ?? "",
            revisions: 2,
            warranty_days: 30,
          }}
        />
      </div>
    </div>
  );
}
