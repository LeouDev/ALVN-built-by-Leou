"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { saveContract, saveContractText } from "@/app/admin/contract-actions";
import { PAYMENT_PLANS, type ContractTerms } from "@/lib/contracts";
import { field } from "@/lib/styles";

export type TermsValues = Partial<Record<keyof ContractTerms, string | number | null>>;

const label = "text-sm font-semibold";
const optional = <span className="font-normal text-muted">(optional)</span>;

/** The contract's terms; saving (re)generates the draft text from the template. */
export function ContractForm({ projectId, id, initial }: { projectId: number | null; id: number | null; initial: TermsValues }) {
  const [state, action, pending] = useActionState(saveContract.bind(null, projectId, id), null);
  const values: TermsValues = state?.values ?? initial;
  const v = (key: keyof ContractTerms) => String(values[key] ?? "");
  const [plan, setPlan] = useState(v("plan") || "50-50");
  const [price, setPrice] = useState(v("price"));
  const amount = Number(price.replace(/[₱,\s]|PHP/gi, ""));
  const preview = PAYMENT_PLANS.find((p) => p.id === plan);

  return (
    <form key={state ? JSON.stringify(state.values) : "initial"} action={action} className="space-y-8 rounded-[28px] border border-line bg-white/45 p-6 sm:p-10">
      <label className="block">
        <span className={label}>Contract title</span>
        <input name="title" required maxLength={120} defaultValue={v("title")} className={field} />
      </label>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Client</legend>
        <label className="block">
          <span className={label}>Name</span>
          <input name="client_name" required maxLength={120} defaultValue={v("client_name")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Email (the signing link goes here)</span>
          <input name="client_email" type="email" required maxLength={254} defaultValue={v("client_email")} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Company / Business {optional}</span>
          <input name="client_company" maxLength={160} defaultValue={v("client_company")} className={field} />
        </label>
      </fieldset>

      <label className="block">
        <span className={label}>Scope: what you’ll build</span>
        <textarea
          name="scope"
          required
          rows={7}
          maxLength={10_000}
          defaultValue={v("scope")}
          placeholder={"- A 5-page website: Home, About, Menu, Order, Contact\n- Online ordering through Messenger\n- A simple admin to update prices"}
          className={`${field} resize-y`}
        />
        <span className="mt-2 block text-xs text-muted">Start lines with “- ” for bullet points.</span>
      </label>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Fees &amp; payment</legend>
        <label className="block">
          <span className={label}>{plan === "retainer" ? "Monthly fee (₱)" : "Price (₱)"}</span>
          <input name="price" required inputMode="numeric" placeholder="50,000" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>Payment terms</span>
          <span className="relative block">
            <select name="plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={`${field} appearance-none pr-12`}>
              {PAYMENT_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/3 text-muted" />
          </span>
        </label>
        {plan === "custom" ? (
          <label className="block sm:col-span-2">
            <span className={label}>Your payment terms</span>
            <textarea name="custom_terms" required rows={3} maxLength={2000} defaultValue={v("custom_terms")} className={`${field} resize-y`} />
          </label>
        ) : (
          <p className="rounded-2xl bg-cream/70 px-5 py-4 text-sm leading-relaxed text-navy/80 sm:col-span-2">
            {amount > 0 && preview ? preview.text(amount) : "Enter a price to see the payment wording."}
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Timeline &amp; guarantees</legend>
        <label className="block">
          <span className={label}>Start date {optional}</span>
          <input name="start_date" type="date" defaultValue={v("start_date")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Completion date {optional}</span>
          <input name="due_date" type="date" defaultValue={v("due_date")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Revision rounds</span>
          <input name="revisions" type="number" min={0} max={20} defaultValue={v("revisions") || "2"} className={field} />
        </label>
        <label className="block">
          <span className={label}>Free bug fixes after launch (days)</span>
          <input name="warranty_days" type="number" min={0} max={365} defaultValue={v("warranty_days") || "30"} className={field} />
        </label>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {state?.error}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Saving…" : id ? "Update Draft" : "Create Draft"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      {id && <p className="text-xs text-muted">Updating the terms rewrites the contract text from the template, replacing any hand edits.</p>}
    </form>
  );
}

/** Hand edits to a draft's wording, for anything the template doesn't cover. */
export function ContractTextForm({ id, body }: { id: number; body: string }) {
  const [state, action, pending] = useActionState(saveContractText.bind(null, id), null);
  return (
    <form action={action} className="space-y-4">
      <textarea name="body" required rows={24} defaultValue={body} className={`${field} resize-y font-mono text-sm leading-relaxed`} />
      <div className="flex items-center justify-between gap-4">
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {state?.error}
        </p>
        <button type="submit" disabled={pending} className="rounded-full border border-line bg-white/70 px-6 py-3 text-sm font-semibold hover:border-navy/40 disabled:opacity-70">
          {pending ? "Saving…" : "Save wording"}
        </button>
      </div>
    </form>
  );
}
