"use client";

/** A one-button form that asks before running its server action (void, delete, resend…). */
export function ConfirmButton({ action, label, confirm: question, className }: { action: () => Promise<void>; label: string; confirm: string; className: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
