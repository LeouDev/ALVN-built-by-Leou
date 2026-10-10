import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Video } from "lucide-react";
import { inManila, requireAdmin } from "@/lib/admin";
import { callScript } from "@/lib/script";

// Booked intro calls, read straight from Google Calendar by the Apps Script (apps-script/Code.gs).
type Call = { id: string; start: string; end: string; name: string; email: string; note: string; meetUrl: string; link: string; response: string };

const MANILA_OFFSET = 8 * 36e5; // Manila has no daylight saving
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const time = (iso: string) => inManila(iso, { hour: "numeric", minute: "2-digit" });

export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  await requireAdmin();
  const { month } = await searchParams;
  const thisMonth = inManila(new Date(), { year: "numeric", month: "2-digit" }).replace(/(\d+)\/(\d+)/, "$2-$1"); // "2026-09"
  const shown = typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : thisMonth;
  const [year, monthIndex] = shown.split("-").map(Number);
  const today = shown === thisMonth ? Number(inManila(new Date(), { day: "numeric" })) : 0;
  const shift = (n: number) => {
    const d = new Date(Date.UTC(year, monthIndex - 1 + n, 1));
    return `/admin/calendar?month=${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const title = new Date(Date.UTC(year, monthIndex - 1, 15)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="headline text-[clamp(2.5rem,5vw,3.5rem)]">{title}</h1>
        <nav aria-label="Months" className="flex items-center gap-2">
          <Link href={shift(-1)} aria-label="Previous month" className="grid size-11 place-items-center rounded-full border border-line bg-white/70 hover:border-navy/40">
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
          <Link href="/admin/calendar" className="rounded-full border border-line bg-white/70 px-4 py-2.5 text-sm font-semibold hover:border-navy/40">
            Today
          </Link>
          <Link href={shift(1)} aria-label="Next month" className="grid size-11 place-items-center rounded-full border border-line bg-white/70 hover:border-navy/40">
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </nav>
      </div>

      {/* Google takes a second or two: show the month right away and fill in the calls when they arrive. */}
      <Suspense key={shown} fallback={<Month year={year} monthIndex={monthIndex} today={today} />}>
        <MonthWithCalls year={year} monthIndex={monthIndex} today={today} />
      </Suspense>
    </>
  );
}

type MonthProps = { year: number; monthIndex: number; today: number };

async function MonthWithCalls(props: MonthProps) {
  const from = Date.UTC(props.year, props.monthIndex - 1, 1) - MANILA_OFFSET; // midnight on the 1st, Manila time
  const to = Date.UTC(props.year, props.monthIndex, 1) - MANILA_OFFSET;
  const reply = await callScript<{ bookings?: Call[] }>({ action: "bookings", from: new Date(from).toISOString(), to: new Date(to).toISOString() }).catch(
    () => null,
  );
  return <Month {...props} calls={reply?.bookings ?? null} />;
}

/** `calls` is undefined while loading and null when Google couldn’t be reached. */
function Month({ year, monthIndex, today, calls }: MonthProps & { calls?: Call[] | null }) {
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const lead = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => i - lead + 1);
  const byDay = new Map<number, Call[]>();
  for (const call of calls ?? []) {
    const day = Number(inManila(call.start, { day: "numeric" }));
    byDay.set(day, [...(byDay.get(day) ?? []), call]);
  }

  return (
    <>
      {calls === null && (
        <p role="alert" className="mt-6 text-sm font-semibold text-[#b42318]">
          Couldn’t load calls from Google Calendar. Refresh to try again.
        </p>
      )}

      <div aria-busy={calls === undefined} className="mt-8 overflow-hidden rounded-[28px] border border-line bg-white/60">
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const inMonth = day >= 1 && day <= days;
            return (
              <div key={i} className={`min-h-24 p-1.5 sm:min-h-28 sm:p-2 ${i % 7 ? "border-l border-line" : ""} ${i >= 7 ? "border-t border-line" : ""} ${inMonth ? "" : "bg-navy/[0.025]"}`}>
                {inMonth && (
                  <>
                    <span className={`grid size-7 place-items-center rounded-full text-sm ${day === today ? "bg-accent font-semibold text-on-accent" : "text-muted"}`}>{day}</span>
                    <ul className="mt-1 space-y-1">
                      {byDay.get(day)?.map((call) => (
                        <li key={call.id}>
                          <a href={`#call-${call.id}`} className="block truncate rounded-lg bg-navy px-1.5 py-1 text-[11px] font-semibold text-cream hover:bg-navy-soft sm:px-2 sm:text-xs">
                            {time(call.start)} <span className="max-sm:hidden">{call.name.split(" ")[0]}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="eyebrow">Calls this month</h2>
        {calls === undefined ? (
          <p className="mt-6 animate-pulse text-muted motion-reduce:animate-none">Loading calls from Google Calendar…</p>
        ) : calls?.length ? (
          <ol className="mt-6 space-y-4">
            {calls.map((call) => (
              <li key={call.id} id={`call-${call.id}`} className="scroll-mt-24 rounded-[28px] border border-line bg-white/60 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted">
                      {inManila(call.start, { weekday: "long", month: "long", day: "numeric" })} · {time(call.start)} – {time(call.end)}
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight">{call.name || "Unnamed guest"}</h3>
                    {call.email && (
                      <a href={`mailto:${call.email}`} className="text-sm text-navy underline underline-offset-4">
                        {call.email}
                      </a>
                    )}
                    {call.response === "declined" && <p className="mt-2 text-sm font-semibold text-[#b42318]">They declined the invite.</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {call.meetUrl && (
                      <a href={call.meetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent">
                        <Video aria-hidden className="size-4" /> Join Meet
                      </a>
                    )}
                    {call.link && (
                      <a href={call.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line bg-white/70 px-4 py-2.5 text-sm font-semibold hover:border-navy/40">
                        Google Calendar <ArrowUpRight aria-hidden className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
                {call.note && <p className="mt-4 leading-relaxed whitespace-pre-wrap text-navy/80">{call.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          calls && <p className="mt-6 text-muted">No calls booked this month.</p>
        )}
      </section>
    </>
  );
}
