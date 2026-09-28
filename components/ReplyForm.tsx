"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { reply } from "@/app/admin/actions";
import { field } from "@/lib/styles";

/** Reply box with a confirm pop-up (showing who it goes to and what it says), locked while sending. */
export function ReplyForm({ id, firstName, email }: { id: number; firstName: string; email: string }) {
  const [state, action, pending] = useActionState(reply.bind(null, id), null);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState("");

  // Close the pop-up once sending has finished (on success the page moves on; on failure the error shows below).
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) dialog.current?.close();
    wasPending.current = pending;
  }, [pending]);

  return (
    <form ref={form} action={action} className="mt-10">
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
          ) : (
            <p className="text-muted">Sent from your Gmail with your signature. Their answer arrives in your Gmail.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!form.current?.reportValidity()) return;
            setPreview(String(new FormData(form.current).get("reply") ?? "").trim());
            dialog.current?.showModal();
          }}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft"
        >
          Send Reply
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={`reply-${id}-title`}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-[28px] border border-line bg-paper p-0 text-navy shadow-2xl backdrop:bg-navy/40 backdrop:backdrop-blur-sm open:animate-[fade-in_200ms_ease-out]"
      >
        <div className="p-7 sm:p-8">
          <h2 id={`reply-${id}-title`} className="text-xl font-semibold tracking-tight">
            Send this reply to {firstName}?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            It goes to <span className="font-semibold text-navy">{email}</span> from your Gmail, with your signature and their message quoted below it.
          </p>
          <blockquote className="mt-4 max-h-52 overflow-auto rounded-2xl bg-cream/80 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-navy/85">{preview}</blockquote>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => dialog.current?.close()} disabled={pending} className="rounded-full px-5 py-3 text-sm font-semibold ring-1 ring-line hover:ring-navy/40 disabled:opacity-50">
              Keep editing
            </button>
            <button type="submit" disabled={pending} autoFocus className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-cream hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70">
              {pending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}
