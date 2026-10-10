import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { signAsClient } from "@/app/contracts/[token]/actions";
import { ContractText, SignatureCard } from "@/components/ContractText";
import { Logo } from "@/components/Logo";
import { SignForm } from "@/components/SignForm";
import { inManila, requestMeta } from "@/lib/admin";
import { getContractByToken, markViewed } from "@/lib/contracts-db";
import { hashToken } from "@/lib/session";
import { signatureFont } from "@/lib/signature-font";

export const metadata: Metadata = {
  title: "Review and sign",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the link itself is the key
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="min-h-dvh pb-24">
      <header className="shell flex h-20 items-center justify-between">
        <Link href="/">
          <Logo className="h-8 w-auto" />
        </Link>
        <span className="eyebrow">Agreement</span>
      </header>
      <div className="shell max-w-4xl">{children}</div>
    </main>
  );
}

export default async function SignContract({ params }: PageProps<"/contracts/[token]">) {
  const { token } = await params;
  const c = /^[\w-]{43}$/.test(token) ? await getContractByToken(hashToken(token)) : null;

  if (!c || (c.status !== "sent" && c.status !== "signed"))
    return (
      <Shell>
        <div className="mx-auto max-w-lg py-24 text-center">
          <h1 className="headline text-4xl">This link isn’t valid anymore.</h1>
          <p className="mt-4 text-muted">It may have been replaced by a newer link, or the agreement was cancelled. Please check your latest email from Leou, or get in touch.</p>
          <Link href="/contact" className="mt-8 inline-block font-semibold underline underline-offset-4">
            Contact Leou
          </Link>
        </div>
      </Shell>
    );

  if (c.status === "sent") await markViewed(c.id, (await requestMeta()).ip);
  const signed = c.status === "signed";

  return (
    <Shell>
      <div className="pt-6">
        {signed ? (
          <div role="status" className="on-dark flex flex-col gap-4 rounded-[28px] bg-navy p-6 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="flex items-start gap-3">
              <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>
                <span className="block font-semibold">Signed by both parties.</span>
                <span className="text-cream/75">
                  {c.client_signer_name} signed on {inManila(c.client_signed_at!, { month: "long", day: "numeric", year: "numeric" })}. A copy was emailed to {c.client_email}.
                </span>
              </span>
            </p>
            <a href={`/contracts/${token}/pdf`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-on-accent">
              <Download aria-hidden className="size-4" /> Download PDF
            </a>
          </div>
        ) : (
          <p className="text-muted">
            Hi {c.client_name.split(" ")[0]}, please read the agreement below. When you’re ready, sign at the bottom of the page.
          </p>
        )}

        <article className="mt-8 rounded-[28px] border border-line bg-white p-7 shadow-[0_24px_60px_-40px_rgba(14,14,14,0.35)] sm:p-12">
          <p className="eyebrow text-accent">Agreement · #{c.id}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{c.title}</h1>
          <div className="mt-6">
            <ContractText body={c.body} />
          </div>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row">
            <SignatureCard role="Provider" name={c.provider_name} image={c.provider_signature} when={c.provider_signed_at} />
            <SignatureCard role="Client" name={c.client_signer_name} image={c.client_signature} when={c.client_signed_at} />
          </div>
        </article>

        {!signed && (
          <section id="sign" className="mt-10 rounded-[28px] border border-line bg-white/60 p-6 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">Sign the agreement</h2>
            <p className="mt-2 text-muted">Once you sign, you’ll both get the signed PDF by email.</p>
            <div className="mt-6">
              <SignForm action={signAsClient.bind(null, token)} defaultName={c.client_name} fontFamily={signatureFont.style.fontFamily} submitLabel="Sign agreement" />
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
