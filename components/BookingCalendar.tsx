"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { field } from "@/components/InquiryForm";
import { NOTE_MAX } from "@/lib/booking";

// English labels, shown in the visitor's own time zone.
const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", options).format(new Date(iso));
const time = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit" });
const longDay = (iso: string) => fmt(iso, { weekday: "long", month: "long", day: "numeric" });
const dayKey = (iso: string) => fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
const endOf = (iso: string) => new Date(Date.parse(iso) + 30 * 6e4).toISOString();
const zoneName = () =>
  new Intl.DateTimeFormat("en-US", { timeZoneName: "long" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;

const choice =
  "block rounded-2xl border border-line bg-white/70 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy hover:border-navy/40";

type Slots = { status: "loading" | "error" } | { status: "ready"; slots: string[] };
type Sending = { status: "idle" | "sending" } | { status: "error"; error: string } | { status: "booked"; start: string; email: string };

export function BookingCalendar() {
  const [slots, setSlots] = useState<Slots>({ status: "loading" });
  const [day, setDay] = useState("");
  const [start, setStart] = useState("");
  const [sending, setSending] = useState<Sending>({ status: "idle" });

  // Refreshes quietly in the background, so anything typed into the form stays put.
  function load() {
    fetch("/api/booking")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { slots: string[] }) => setSlots({ status: "ready", slots: data.slots }))
      .catch(() => setSlots({ status: "error" }));
  }
  useEffect(load, []);

  const days = useMemo(() => {
    const byDay = new Map<string, string[]>();
    if (slots.status === "ready") for (const s of slots.slots) byDay.set(dayKey(s), [...(byDay.get(dayKey(s)) ?? []), s]);
    return [...byDay];
  }, [slots]);
  const [selectedDay, times] = days.find(([key]) => key === day) ?? days[0] ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setSending({ status: "sending" });
    let error = "Your call couldn’t be booked. Please check your connection and try again.";
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) return setSending({ status: "booked", start: String(form.start), email: String(form.email) });
      error = (await res.json().catch(() => null))?.error ?? error;
      if (res.status === 409) {
        setStart("");
        load();
      }
    } catch {}
    setSending({ status: "error", error });
  }

  if (sending.status === "booked")
    return (
      <div role="status" tabIndex={-1} ref={(el) => el?.focus()} className="rounded-[28px] border border-line bg-white/70 p-8 outline-none sm:p-12">
        <span className="grid size-12 place-items-center rounded-full bg-accent text-navy">
          <Check aria-hidden className="size-5" />
        </span>
        <h2 className="mt-8 text-3xl font-semibold tracking-tight">You’re booked.</h2>
        <p className="mt-3 text-lg font-semibold">
          {longDay(sending.start)} · {time(sending.start)} – {time(endOf(sending.start))}
        </p>
        <p className="mt-3 max-w-md text-muted">
          A Google Calendar invite with the Meet link is on its way to {sending.email}. If Google says it’s from an “unknown
          sender”, tap “Add to calendar”.
        </p>
        <button
          type="button"
          onClick={() => {
            setSending({ status: "idle" });
            setStart("");
            load();
          }}
          className="mt-8 text-sm font-semibold underline underline-offset-4"
        >
          Book another time
        </button>
      </div>
    );

  return (
    <div className="rounded-[28px] border border-line bg-white/45 p-6 sm:p-10">
      {slots.status === "loading" && <p className="py-20 text-center text-sm text-muted">Loading available times…</p>}

      {slots.status === "error" && (
        <div role="alert" className="py-16 text-center">
          <p className="font-semibold">Available times couldn’t be loaded.</p>
          <button
            type="button"
            onClick={() => {
              setSlots({ status: "loading" });
              load();
            }}
            className="mt-3 text-sm font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {slots.status === "ready" && !times && (
        <p className="py-16 text-center text-muted">No open times in the next two weeks. Send an inquiry instead, and I’ll get back to you.</p>
      )}

      {times && (
        <form onSubmit={onSubmit} className="space-y-8">
          <fieldset>
            <legend className="text-sm font-semibold">Pick a day</legend>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {days.map(([key, list]) => (
                <label key={key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="day"
                    value={key}
                    checked={key === selectedDay}
                    onChange={() => {
                      setDay(key);
                      setStart("");
                    }}
                    className="peer sr-only"
                  />
                  <span className={`${choice} py-3 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-cream`}>
                    <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase opacity-70">{fmt(list[0], { weekday: "short" })}</span>
                    <span className="mt-0.5 block text-2xl font-semibold">{fmt(list[0], { day: "numeric" })}</span>
                    <span className="block text-xs opacity-70">{fmt(list[0], { month: "short" })}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">
              Pick a time <span className="font-normal text-muted">({zoneName()})</span>
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {times.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="radio" name="start" value={s} required checked={s === start} onChange={() => setStart(s)} className="peer sr-only" />
                  <span className={`${choice} rounded-full py-2.5 text-sm font-semibold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-navy`}>
                    {time(s)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Name</span>
              <input name="name" required maxLength={120} autoComplete="name" className={field} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Email</span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" className={field} />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold">
              What would you like to talk about? <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea name="note" rows={3} maxLength={NOTE_MAX} className={`${field} resize-y`} />
          </label>

          {/* Honeypot for bots — hidden from people and assistive tech */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p role="alert" className="font-semibold text-[#b42318]">
                {sending.status === "error" && sending.error}
              </p>
              {start && sending.status !== "error" && (
                <p className="text-muted">
                  {longDay(start)} · {time(start)} – {time(endOf(start))} on Google Meet
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={sending.status === "sending"}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
            >
              {sending.status === "sending" ? "Booking…" : "Book Call"}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
