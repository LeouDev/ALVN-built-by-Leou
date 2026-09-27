"use client";

import { useState } from "react";
import { CalendarDays, Mail } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";

// Google Calendar appointment schedule: `gv=true` is Google's embeddable view of the booking page.
const embed = (url: string) => `${url}${url.includes("?") ? "&" : "?"}gv=true`;

const TABS = [
  { id: "inquiry", label: "Send an inquiry", icon: Mail },
  // Short on phones so both options fit on one line.
  { id: "call", label: <>Book a <span className="max-sm:hidden">30-min </span>call</>, icon: CalendarDays },
] as const;

export function ContactOptions({ bookingUrl }: { bookingUrl: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("inquiry");
  // Google's embed loads on first open, then stays mounted so switching back doesn't reload it.
  const [embedded, setEmbedded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!bookingUrl) return <InquiryForm />;

  return (
    <div>
      <div role="group" aria-label="How would you like to start?" className="mb-6 inline-flex flex-wrap gap-1 rounded-full border border-line bg-white/50 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              if (id === "call") setEmbedded(true);
            }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-navy/70 transition-colors hover:text-navy aria-pressed:bg-navy aria-pressed:text-cream"
          >
            <Icon aria-hidden className="size-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* The form stays mounted so anything typed survives switching tabs. */}
      <div hidden={tab !== "inquiry"}>
        <InquiryForm />
      </div>

      <div hidden={tab !== "call"}>
        {embedded && (
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-white">
            {/* Sits behind the iframe (whose page is transparent) until it loads. */}
            {!loaded && <p className="absolute inset-0 grid place-items-center text-sm text-muted">Loading available times…</p>}
            <iframe
              src={embed(bookingUrl)}
              onLoad={() => setLoaded(true)}
              title="Book a 30-minute call with Leou"
              className="relative block h-[clamp(480px,calc(100svh-8rem),860px)] w-full"
            />
          </div>
        )}
        <p className="mt-4 text-sm text-muted">
          Pick a time that works for you — you’ll get a confirmation email with a Google Meet link.{" "}
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline underline-offset-4">
            Open the booking page ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </div>
  );
}
