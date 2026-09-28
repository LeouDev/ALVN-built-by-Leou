"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { reply } from "@/app/admin/actions";
import { field } from "@/lib/styles";

export function ReplyForm({ id, firstName, sent }: { id: number; firstName: string; sent: boolean }) {
  const [state, action, pending] = useActionState(reply.bind(null, id), null);

  return (
    <form action={action} className="mt-10">
      <label className="block">
        <span className="text-sm font-semibold">Reply to {firstName}</span>
        {/* After a failed send the action hands the text back, so nothing typed is lost. */}
        <textarea key={state?.text} name="reply" required rows={7} defaultValue={state?.text} className={`${field} resize-y`} />
      </label>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {state?.error ? (
            <p role="alert" className="font-semibold text-[#b42318]">
              {state.error}
            </p>
          ) : sent ? (
            <p role="status" className="font-semibold text-[#067647]">
              Sent from your Gmail.
            </p>
          ) : (
            <p className="text-muted">Sent from your Gmail with your signature. Their answer arrives in your Gmail.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send Reply"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}
