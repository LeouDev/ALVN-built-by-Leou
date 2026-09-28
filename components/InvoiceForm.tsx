"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { saveInvoice } from "@/app/admin/invoice-actions";
import { php, type InvoiceItem } from "@/lib/invoices";
import { field } from "@/lib/styles";

export type InvoiceValues = {
  client_name: string;
  client_email: string;
  client_company: string;
  items: InvoiceItem[];
  issue_date: string;
  due_date: string;
  notes: string;
};

type Row = { description: string; amount: string };
const label = "text-sm font-semibold";

export function InvoiceForm({ projectId, id, initial, shortcuts }: { projectId: number | null; id: number | null; initial: InvoiceValues; shortcuts: InvoiceItem[] }) {
  const [state, action, pending] = useActionState(saveInvoice.bind(null, projectId, id), null);
  const submitted = state?.values;
  const one = (key: keyof InvoiceValues) => String(submitted?.[key]?.[0] ?? initial[key] ?? "");

  const [rows, setRows] = useState<Row[]>(() => {
    const start = initial.items.map((i) => ({ description: i.description, amount: String(i.amount) }));
    return start.length ? start : [{ description: "", amount: "" }];
  });
  const total = rows.reduce((sum, r) => sum + (Number(r.amount.replace(/[₱,\s]/g, "")) || 0), 0);
  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = (row: Row = { description: "", amount: "" }) =>
    setRows((rs) => (rs.length === 1 && !rs[0].description && !rs[0].amount ? [row] : [...rs, row]));

  return (
    <form key={submitted ? JSON.stringify(submitted) : "initial"} action={action} className="space-y-8 rounded-[28px] border border-line bg-white/45 p-6 sm:p-10">
      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Bill to</legend>
        <label className="block">
          <span className={label}>Name</span>
          <input name="client_name" required maxLength={120} defaultValue={one("client_name")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Email (the invoice goes here)</span>
          <input name="client_email" type="email" required maxLength={254} defaultValue={one("client_email")} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>
            Company / Business <span className="font-normal text-muted">(optional)</span>
          </span>
          <input name="client_company" maxLength={160} defaultValue={one("client_company")} className={field} />
        </label>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4">Line items</legend>
        {shortcuts.length > 0 && (
          <div className="mb-5">
            <p className="text-sm text-muted">From the contract:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {shortcuts.map((s) => (
                <button
                  key={s.description}
                  type="button"
                  onClick={() => add({ description: s.description, amount: String(s.amount) })}
                  className="rounded-full border border-line bg-white/70 px-3.5 py-2 text-left text-xs font-semibold transition-colors hover:border-navy/40"
                >
                  + {s.description.replace(/^.*?: /, "")} · {php(s.amount)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_8.5rem_auto] items-start gap-2">
              <input
                name="item_description"
                aria-label={`Line ${i + 1} description`}
                placeholder="What it’s for"
                value={r.description}
                onChange={(e) => update(i, { description: e.target.value })}
                className={`${field} mt-0!`}
              />
              <input
                name="item_amount"
                aria-label={`Line ${i + 1} amount in pesos`}
                inputMode="numeric"
                placeholder="₱ 0"
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                className={`${field} mt-0! text-right`}
              />
              <button
                type="button"
                aria-label={`Remove line ${i + 1}`}
                onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{ description: "", amount: "" }]))}
                className="grid size-12 place-items-center rounded-full text-navy/50 hover:text-navy"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => add()} className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
            <Plus aria-hidden className="size-4" /> Add line
          </button>
          <p className="text-sm">
            Total <span className="ml-2 text-lg font-semibold">{php(total)}</span>
          </p>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="eyebrow mb-6">Dates</legend>
        <label className="block">
          <span className={label}>Issue date</span>
          <input name="issue_date" type="date" required defaultValue={one("issue_date")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Due date</span>
          <input name="due_date" type="date" required defaultValue={one("due_date")} className={field} />
        </label>
      </fieldset>

      <label className="block">
        <span className={label}>How to pay</span>
        <textarea
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={one("notes")}
          placeholder={"BDO Savings · Account name · Account number\nGCash · 09xx xxx xxxx · Account name"}
          className={`${field} resize-y`}
        />
        <span className="mt-2 block text-xs text-muted">Shown on the invoice and in the email. Your next invoice starts with this filled in.</span>
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
          {pending ? "Saving…" : id ? "Update Draft" : "Create Draft"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}
