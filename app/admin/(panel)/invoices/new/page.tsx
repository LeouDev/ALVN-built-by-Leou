import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/InvoiceForm";
import { requireAdmin, todayInManila } from "@/lib/admin";
import { getProject } from "@/lib/client-projects-db";
import { installments } from "@/lib/contracts";
import { latestContractTerms } from "@/lib/contracts-db";
import { lastNotes } from "@/lib/invoices-db";

const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);

export default async function NewInvoice({ searchParams }: PageProps<"/admin/invoices/new">) {
  await requireAdmin();
  const { project: projectParam } = await searchParams;
  const project = typeof projectParam === "string" && /^\d+$/.test(projectParam) ? await getProject(Number(projectParam)) : null;
  const terms = project ? await latestContractTerms(project.id) : null;
  const today = todayInManila();

  return (
    <div className="max-w-3xl">
      <Link href={project ? `/admin/projects/${project.id}` : "/admin/invoices"} className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
        <ArrowLeft aria-hidden className="size-4" /> {project ? project.name : "Invoices"}
      </Link>
      <h1 className="headline mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)]">New invoice</h1>
      <p className="mt-3 text-muted">Create a draft, check it, then send it with the PDF attached. It’s numbered when you create it.</p>
      <div className="mt-8">
        <InvoiceForm
          projectId={project?.id ?? null}
          id={null}
          shortcuts={terms ? installments(terms) : []}
          initial={{
            client_name: project?.client_name ?? "",
            client_email: project?.client_email ?? "",
            client_company: project?.company ?? "",
            items: [],
            issue_date: today,
            due_date: addDays(today, 7), // the contracts say invoices are due within 7 days
            notes: await lastNotes(),
          }}
        />
      </div>
    </div>
  );
}
