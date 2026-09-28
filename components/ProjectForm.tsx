"use client";

import { useActionState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { removeProject, saveProject } from "@/app/admin/actions";
import { STAGES, stageLabels, type ProjectInput } from "@/lib/client-projects";
import { PROJECT_TYPES } from "@/lib/inquiry";
import { field } from "@/lib/styles";

export type ProjectValues = Partial<Record<keyof ProjectInput, string | number | null>>;

const label = "text-sm font-semibold";
const optional = <span className="font-normal text-muted">(optional)</span>;

export function ProjectForm({ id, initial }: { id: number | null; initial: ProjectValues }) {
  const [state, action, pending] = useActionState(saveProject.bind(null, id), null);
  // After a validation error the action hands back what was submitted; the key remounts the fields with it.
  const values: ProjectValues = state?.values ?? initial;
  const v = (key: keyof ProjectInput) => String(values[key] ?? "");

  return (
    <form key={state ? JSON.stringify(state.values) : "initial"} action={action} className="space-y-8 rounded-[28px] border border-line bg-white/45 p-6 sm:p-10">
      <input type="hidden" name="message_id" defaultValue={v("message_id")} />

      <label className="block">
        <span className={label}>Project name</span>
        <input name="name" required maxLength={160} defaultValue={v("name")} className={field} />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <Select name="stage" label="Stage" value={v("stage") || "lead"} options={STAGES.map((s) => [s, stageLabels[s]])} />
        <Select name="type" label="Type" value={v("type")} options={[["", "—"], ...PROJECT_TYPES.map((t) => [t, t] as [string, string])]} />
      </div>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Client</legend>
        <label className="block">
          <span className={label}>Name</span>
          <input name="client_name" required maxLength={120} defaultValue={v("client_name")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Email {optional}</span>
          <input name="client_email" type="email" maxLength={254} defaultValue={v("client_email")} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Company / Business {optional}</span>
          <input name="company" maxLength={160} defaultValue={v("company")} className={field} />
        </label>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Money &amp; dates</legend>
        <label className="block">
          <span className={label}>Budget (₱) {optional}</span>
          <input name="budget" inputMode="numeric" placeholder="50,000" defaultValue={v("budget")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Paid so far (₱)</span>
          <input name="paid" inputMode="numeric" placeholder="0" defaultValue={v("paid")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Start date {optional}</span>
          <input name="start_date" type="date" defaultValue={v("start_date")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Due date {optional}</span>
          <input name="due_date" type="date" defaultValue={v("due_date")} className={field} />
        </label>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Links</legend>
        <label className="block">
          <span className={label}>Live site {optional}</span>
          <input name="live_url" type="url" placeholder="https://" defaultValue={v("live_url")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Repository {optional}</span>
          <input name="repo_url" type="url" placeholder="https://github.com/…" defaultValue={v("repo_url")} className={field} />
        </label>
      </fieldset>

      <label className="block">
        <span className={label}>Notes {optional}</span>
        <textarea name="notes" rows={7} maxLength={10_000} defaultValue={v("notes")} className={`${field} resize-y`} />
      </label>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {state?.error}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Saving…" : id ? "Save Changes" : "Create Project"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

function Select({ name, label: text, value, options }: { name: string; label: string; value: string; options: [string, string][] }) {
  return (
    <label className="block">
      <span className={label}>{text}</span>
      <span className="relative block">
        <select name={name} defaultValue={value} className={`${field} appearance-none pr-12`}>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/3 text-muted" />
      </span>
    </label>
  );
}

export function DeleteProjectButton({ id }: { id: number }) {
  return (
    <form
      action={removeProject.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm("Delete this project? This can’t be undone.")) event.preventDefault();
      }}
    >
      <button type="submit" className="w-full rounded-full border border-line bg-white/70 px-6 py-3.5 text-sm font-semibold text-[#b42318] transition-colors hover:border-[#b42318]/40">
        Delete project
      </button>
    </form>
  );
}
