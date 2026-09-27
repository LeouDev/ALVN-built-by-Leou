"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { BUDGETS, MESSAGE_MAX, PROJECT_TYPES, TIMELINES } from "@/lib/inquiry";

const field =
  "mt-2 block w-full rounded-2xl border border-line bg-white/70 px-4 py-3.5 text-base text-navy outline-none transition placeholder:text-muted/70 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10";

export function InquiryForm() {
  const [state, setState] = useState<{ status: "idle" | "sending" | "sent" | "error"; error?: string }>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    setState({ status: "sending" });
    let error = "Your inquiry couldn’t be sent. Please check your connection and try again.";
    try {
      const res = await fetch("/api/inquiry", { method: "POST", body });
      if (res.ok) return setState({ status: "sent" });
      error = (await res.json().catch(() => null))?.error ?? error;
    } catch {}
    setState({ status: "error", error });
  }

  if (state.status === "sent")
    return (
      <div role="status" tabIndex={-1} ref={(el) => el?.focus()} className="rounded-[28px] border border-line bg-white/70 p-8 outline-none sm:p-12">
        <span className="grid size-12 place-items-center rounded-full bg-accent text-navy">
          <Check aria-hidden className="size-5" />
        </span>
        <h2 className="mt-8 text-3xl font-semibold tracking-tight">Thanks — your inquiry is on its way.</h2>
        <p className="mt-3 max-w-md text-muted">I’ll read it and get back to you by email.</p>
        <button type="button" onClick={() => setState({ status: "idle" })} className="mt-8 text-sm font-semibold underline underline-offset-4">
          Send another inquiry
        </button>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-[28px] border border-line bg-white/45 p-6 sm:p-10">
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
          Company / Business <span className="font-normal text-muted">(optional)</span>
        </span>
        <input name="company" maxLength={160} autoComplete="organization" className={field} />
      </label>

      <div>
        <label htmlFor="projectType" className="text-sm font-semibold">
          What are you looking to build?
        </label>
        <span className="relative block">
          <select id="projectType" name="projectType" required defaultValue="" className={`${field} appearance-none pr-12`}>
            <option value="" disabled>
              Select one
            </option>
            {PROJECT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/3 text-muted" />
        </span>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Tell me about your project</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder="What are you building, who is it for, and where are you now?"
          className={`${field} resize-y`}
        />
      </label>

      <Choices legend="Budget" name="budget" options={BUDGETS} />
      <Choices legend="Timeline" name="timeline" options={TIMELINES} />

      {/* Honeypot for bots — hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {state.status === "error" && state.error}
        </p>
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
        >
          {state.status === "sending" ? "Sending…" : "Send Inquiry"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

function Choices({ legend, name, options }: { legend: string; name: string; options: readonly string[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">
        {legend} <span className="font-normal text-muted">(optional)</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input type="radio" name={name} value={option} className="peer sr-only" />
            <span className="block rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-medium transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy hover:border-navy/40">
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
