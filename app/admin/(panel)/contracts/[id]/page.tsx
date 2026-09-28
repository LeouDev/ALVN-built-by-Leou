import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { deleteDraftAction, resendLink, signAndSend, voidAction } from "@/app/admin/contract-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ContractForm, ContractTextForm } from "@/components/ContractForm";
import { StatusPill } from "@/components/ContractStatus";
import { ContractText, SignatureCard } from "@/components/ContractText";
import { SignForm } from "@/components/SignForm";
import { inManila, requireAdmin } from "@/lib/admin";
import { getContract, provider, type Contract } from "@/lib/contracts-db";
import { signatureFont } from "@/lib/signature-font";

const at = (d: Date | null) => (d ? inManila(d, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const plainButton = "w-full rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-navy/40";

const flashes: Record<string, [string, string]> = {
  saved: ["Draft saved.", "text-[#067647]"],
  sent: ["Signed and sent. Your client has the signing link.", "text-[#067647]"],
  resent: ["A new signing link is on its way. The old one no longer works.", "text-[#067647]"],
  failed: ["The email couldn’t be sent. Google can be slow for a minute after the script is updated, so try “Send a new link” again shortly. Any link already sent still works.", "text-[#b42318]"],
};

function Timeline({ c }: { c: Contract }) {
  const steps: [string, string, boolean][] = [
    ["Draft created", at(c.created_at), true],
    ["You signed", at(c.provider_signed_at), Boolean(c.provider_signed_at)],
    [`Sent to ${c.client_email}`, at(c.sent_at), Boolean(c.sent_at)],
    ["Opened by client", c.viewed_at ? at(c.viewed_at) : c.status === "sent" ? "Not opened yet" : "", Boolean(c.viewed_at)],
    [`Signed by ${c.client_signer_name ?? "client"}`, at(c.client_signed_at), Boolean(c.client_signed_at)],
  ];
  return (
    <ol className="space-y-4 rounded-[22px] border border-line bg-white/60 p-6">
      {steps.map(([label, when, done]) => (
        <li key={label} className="flex gap-3">
          <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${done ? "bg-accent" : "border border-navy/25"}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${done ? "" : "text-muted"}`}>{label}</span>
            {when && <span className="block text-xs text-muted">{when}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function ContractPage({ params, searchParams }: PageProps<"/admin/contracts/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const c = Number.isSafeInteger(id) ? await getContract(id) : null;
  if (!c) notFound();
  const query = await searchParams;
  const flash = query.email === "failed" ? flashes.failed : flashes[Object.keys(flashes).find((k) => k !== "failed" && query[k]) ?? ""];
  const first = c.client_name.split(" ")[0];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Link href={c.project_id ? `/admin/projects/${c.project_id}` : "/admin/contracts"} className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
          <ArrowLeft aria-hidden className="size-4" /> {c.project_id ? "Project" : "Contracts"}
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="headline text-[clamp(2rem,4vw,3rem)]">{c.title}</h1>
          <StatusPill status={c.status} viewed={Boolean(c.viewed_at)} />
        </div>
        <p className="mt-2 text-muted">
          For {c.client_name}
          {c.client_company && ` · ${c.client_company}`} · Contract #{c.id}
        </p>
        {flash && (
          <p role="status" className={`mt-4 text-sm font-semibold ${flash[1]}`}>
            {flash[0]}
          </p>
        )}

        <article className="mt-8 rounded-[28px] border border-line bg-white p-7 shadow-[0_24px_60px_-40px_rgba(7,26,45,0.35)] sm:p-12">
          <p className="eyebrow text-accent">Agreement</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{c.title}</h2>
          <div className="mt-6">
            <ContractText body={c.body} />
          </div>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row">
            <SignatureCard role="Provider" name={c.provider_name} image={c.provider_signature} when={c.provider_signed_at} />
            <SignatureCard role="Client" name={c.client_signer_name} image={c.client_signature} when={c.client_signed_at} />
          </div>
        </article>

        {c.status === "draft" && (
          <>
            <details className="group mt-8 rounded-[28px] border border-line bg-white/45">
              <summary className="cursor-pointer list-none px-7 py-5 font-semibold">Change the terms</summary>
              <div className="px-2 pb-2 sm:px-4 sm:pb-4">
                <ContractForm projectId={c.project_id} id={c.id} initial={c.terms} />
              </div>
            </details>
            <details className="mt-4 rounded-[28px] border border-line bg-white/45">
              <summary className="cursor-pointer list-none px-7 py-5 font-semibold">Edit the wording</summary>
              <div className="px-7 pb-7">
                <ContractTextForm id={c.id} body={c.body} />
              </div>
            </details>

            <section className="mt-10 rounded-[28px] border border-line bg-white/60 p-6 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight">Sign and send</h2>
              <p className="mt-2 text-muted">
                Your signature is added and the text is locked. {first} gets an email with a private link to review and sign.
              </p>
              <div className="mt-6">
                <SignForm action={signAndSend.bind(null, c.id)} defaultName={provider().name} fontFamily={signatureFont.style.fontFamily} submitLabel={`Sign and send to ${first}`} />
              </div>
            </section>
          </>
        )}
      </div>

      <aside className="space-y-4 lg:col-span-4 lg:pt-12">
        <Timeline c={c} />
        {(c.status === "draft" || c.status === "sent") && (
          <a href={`/admin/contracts/${c.id}/pdf`} target="_blank" className={`${plainButton} inline-flex items-center justify-center gap-2`}>
            <Download aria-hidden className="size-4" /> Preview PDF
          </a>
        )}
        {c.status === "signed" && (
          <a href={`/admin/contracts/${c.id}/pdf`} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-navy hover:bg-[#ff8a3d]">
            <Download aria-hidden className="size-4" /> Download signed PDF
          </a>
        )}
        {c.status === "sent" && (
          <>
            <ConfirmButton action={resendLink.bind(null, c.id)} label="Send a new link" confirm={`Email ${first} a new signing link? The current link will stop working.`} className={plainButton} />
            <ConfirmButton action={voidAction.bind(null, c.id)} label="Void contract" confirm="Void this contract? The signing link stops working and it can’t be signed." className={`${plainButton} text-[#b42318]`} />
          </>
        )}
        {c.status === "draft" && (
          <ConfirmButton action={deleteDraftAction.bind(null, c.id)} label="Delete draft" confirm="Delete this draft? This can’t be undone." className={`${plainButton} text-[#b42318]`} />
        )}
        {c.status === "void" && <p className="text-sm text-muted">This contract was voided and can no longer be signed.</p>}
      </aside>
    </div>
  );
}
