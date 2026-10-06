import { cookies, headers } from "next/headers";
import Link from "next/link";
import { PasskeySetup } from "@/components/Passkey";
import { hasPasskeys, inManila, PASSKEY_PROMPT_COOKIE, passkeyChallenge, requireAdmin, siteRpId } from "@/lib/admin";
import { listMessages, type Message } from "@/lib/inbox";
import { ALGORITHMS, passkeyName } from "@/lib/passkeys";

const KIND_LABELS = { inquiry: "Inquiry", booking: "Call" } as const;

const pill =
  "rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold transition-colors hover:border-navy/40 aria-[current=page]:border-navy aria-[current=page]:bg-navy aria-[current=page]:text-cream";

function preview(m: Message) {
  if (m.kind === "booking") {
    const when = m.details.start
      ? inManila(m.details.start, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "";
    return [when && `Call on ${when}`, m.body].filter(Boolean).join(" · ");
  }
  return [m.subject, m.body].filter(Boolean).join(" · ");
}

export default async function Inbox({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const archived = params.view === "archived";
  const kind = params.kind === "inquiry" || params.kind === "booking" ? params.kind : undefined;
  const messages = await listMessages({ archived, kind });
  // Offer Face ID sign-in until a passkey is saved, unless "Not now" was chosen on this device.
  const passkeyOffer =
    !(await cookies()).get(PASSKEY_PROMPT_COOKIE) && !(await hasPasskeys())
      ? { name: passkeyName((await headers()).get("user-agent") ?? ""), challenge: passkeyChallenge(), rpId: await siteRpId(), algorithms: ALGORITHMS }
      : null;

  const href = (next: { view?: string; kind?: string }) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ view: archived ? "archived" : undefined, kind, ...next })) if (value) query.set(key, value);
    return `/admin${query.size ? `?${query}` : ""}`;
  };

  return (
    <>
      {passkeyOffer && <PasskeySetup {...passkeyOffer} />}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="headline text-[clamp(2.5rem,5vw,3.5rem)]">{archived ? "Archived" : "Inbox"}</h1>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", kind: undefined },
            { label: "Inquiries", kind: "inquiry" },
            { label: "Calls", kind: "booking" },
          ].map((f) => (
            <Link key={f.label} href={href({ kind: f.kind ?? "" })} aria-current={kind === f.kind ? "page" : undefined} className={pill}>
              {f.label}
            </Link>
          ))}
          <Link href={href({ view: archived ? "" : "archived" })} className={`${pill} ml-2`}>
            {archived ? "Back to inbox" : "Archived"}
          </Link>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-10 rounded-[28px] border border-line bg-white/60 px-7 py-16 text-center text-muted">
          {archived ? "Nothing archived yet." : "No messages yet. New inquiries and booked calls show up here."}
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-white/60">
          {messages.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/messages/${m.id}`}
                className="grid grid-cols-[0.5rem_1fr_auto] items-start gap-x-4 px-5 py-5 transition-colors hover:bg-white sm:px-7"
              >
                <span aria-hidden className={`mt-2 size-2 rounded-full ${m.read_at ? "" : "bg-accent"}`} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={m.read_at ? "font-medium" : "font-bold"}>{m.name}</span>
                    <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-navy/70">{KIND_LABELS[m.kind]}</span>
                    {!m.read_at && <span className="sr-only">(unread)</span>}
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted">{preview(m)}</span>
                </span>
                <time dateTime={new Date(m.created_at).toISOString()} className="text-xs whitespace-nowrap text-muted">
                  {inManila(m.created_at, { month: "short", day: "numeric" })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
