"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

/** A pop-up notice at the top of the screen that fades after a few seconds. Give it a fresh `key` per event. */
export function Toast({ message, tone }: { message: string; tone: "success" | "error" }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), tone === "error" ? 12_000 : 6_000);
    return () => clearTimeout(timer);
  }, [tone]);
  if (!open) return null;

  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="fixed inset-x-4 top-20 z-50 mx-auto flex max-w-md animate-[fade-up_300ms_ease-out] items-start gap-3 rounded-2xl bg-navy on-dark px-5 py-4 text-cream shadow-2xl"
    >
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${tone === "success" ? "text-accent" : "text-[#ffb4a9]"}`} />
      <p className="flex-1 text-sm leading-relaxed">{message}</p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss" className="-m-1 rounded-full p-1 text-cream/70 hover:text-cream">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
