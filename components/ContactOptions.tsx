"use client";

import { useState } from "react";
import { CalendarDays, Mail } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { InquiryForm } from "@/components/InquiryForm";

const TABS = [
  { id: "inquiry", label: "Send an inquiry", icon: Mail },
  // Short on phones so both options fit on one line.
  { id: "call", label: <>Book a <span className="max-sm:hidden">30-min </span>call</>, icon: CalendarDays },
] as const;

export function ContactOptions({ booking }: { booking: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("inquiry");
  // The calendar loads open times on first open, then stays mounted so switching back keeps its place.
  const [opened, setOpened] = useState(false);
  if (!booking) return <InquiryForm />;

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
              if (id === "call") setOpened(true);
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

      <div hidden={tab !== "call"}>{opened && <BookingCalendar />}</div>
    </div>
  );
}
