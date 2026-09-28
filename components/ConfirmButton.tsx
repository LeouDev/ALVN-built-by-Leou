"use client";

import { useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  action: () => Promise<void>;
  label: string;
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel: string;
  danger?: boolean;
  className: string;
};

/** A button that asks in a pop-up first, then locks while its server action runs, so it can't fire twice. */
export function ConfirmButton({ action, label, title, message, confirmLabel, pendingLabel, danger, className }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={className}>
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-[28px] border border-line bg-paper p-0 text-navy shadow-2xl backdrop:bg-navy/40 backdrop:backdrop-blur-sm open:animate-[fade-in_200ms_ease-out]"
      >
        <form action={action} className="p-7 sm:p-8">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-2 leading-relaxed text-muted">{message}</p>
          <Buttons confirmLabel={confirmLabel} pendingLabel={pendingLabel} danger={danger} onClose={() => dialog.current?.close()} />
        </form>
      </dialog>
    </>
  );
}

function Buttons({ confirmLabel, pendingLabel, danger, onClose }: { confirmLabel: string; pendingLabel: string; danger?: boolean; onClose: () => void }) {
  const { pending } = useFormStatus();
  // Close once the action has finished (the page has already re-rendered with its result).
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) onClose();
    wasPending.current = pending;
  }, [pending, onClose]);

  return (
    <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} disabled={pending} className="rounded-full px-5 py-3 text-sm font-semibold ring-1 ring-line hover:ring-navy/40 disabled:opacity-50">
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        autoFocus
        className={`rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70 ${danger ? "bg-[#b42318] text-white hover:bg-[#912018]" : "bg-navy text-cream hover:bg-navy-soft"}`}
      >
        {pending ? pendingLabel : confirmLabel}
      </button>
    </div>
  );
}
