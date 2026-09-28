import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { archive } from "@/app/admin/actions";
import { ReplyForm } from "@/components/ReplyForm";
import { inManila, requireAdmin } from "@/lib/admin";
import { openMessage } from "@/lib/inbox";

const longDate = { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" } as const;

export default async function MessagePage({ params, searchParams }: PageProps<"/admin/messages/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const opened = Number.isSafeInteger(id) ? await openMessage(id) : null;
  if (!opened) notFound();
  const { message: m, replies } = opened;
  const { sent } = await searchParams;

  const facts: [string, string | undefined][] =
    m.kind === "booking"
      ? [["Call", m.details.start && `${inManila(m.details.start, longDate)} (Manila time)`]]
      : [
          ["Building", m.subject],
          ["Company", m.details.company],
          ["Budget", m.details.budget],
          ["Timeline", m.details.timeline],
        ];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <article className="lg:col-span-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-navy/65 hover:text-navy">
          <ArrowLeft aria-hidden className="size-4" /> Inbox
        </Link>
        <h1 className="headline mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)]">{m.name}</h1>
        <p className="mt-3 text-muted">
          <a href={`mailto:${m.email}`} className="font-semibold text-navy underline underline-offset-4">
            {m.email}
          </a>{" "}
          · {m.kind === "booking" ? "Booked a call" : "Inquiry"} · {inManila(m.created_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>

        <dl className="mt-8 grid gap-x-6 gap-y-3 rounded-[28px] border border-line bg-white/60 p-6 sm:grid-cols-[8rem_1fr] sm:p-8">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          <dt className="text-sm text-muted">{m.kind === "booking" ? "Their note" : "Message"}</dt>
          <dd className="leading-relaxed whitespace-pre-wrap">{m.body || <span className="text-muted">None</span>}</dd>
        </dl>

        {replies.length > 0 && (
          <ol className="mt-8 space-y-4">
            {replies.map((r) => (
              <li key={r.id} className="rounded-[28px] bg-navy p-6 text-cream sm:p-8">
                <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
                  You replied · {inManila(r.sent_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="mt-3 leading-relaxed whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ol>
        )}

        <ReplyForm id={m.id} firstName={m.name.split(" ")[0]} sent={Boolean(sent)} />
      </article>

      <aside className="lg:col-span-4 lg:pt-12">
        <form action={archive.bind(null, m.id, !m.archived_at)}>
          <button type="submit" className="w-full rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-navy/40">
            {m.archived_at ? "Move back to inbox" : "Archive"}
          </button>
        </form>
      </aside>
    </div>
  );
}
