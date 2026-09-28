"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { field } from "@/lib/styles";

type SignAction = (state: { error: string } | null, form: FormData) => Promise<{ error: string } | null>;

/** Full name + a drawn or typed signature + consent. The signature travels as a PNG data URL. */
export function SignForm({ action, defaultName, fontFamily, submitLabel }: { action: SignAction; defaultName: string; fontFamily: string; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [signature, setSignature] = useState("");
  const [missing, setMissing] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!signature) {
          event.preventDefault();
          setMissing(true);
        }
      }}
      className="space-y-6"
    >
      <label className="block">
        <span className="text-sm font-semibold">Full name</span>
        <input name="signer_name" required maxLength={120} autoComplete="name" defaultValue={defaultName} className={field} />
      </label>
      <SignaturePad fontFamily={fontFamily} defaultText={defaultName} onChange={(png) => (setSignature(png), setMissing(false))} />
      <input type="hidden" name="signature" value={signature} />
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-navy" />
        <span>I agree to sign this agreement electronically, and that my electronic signature is legally binding, the same as a handwritten one.</span>
      </label>
      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {missing ? "Please add your signature." : state?.error}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Signing…" : submitLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

const W = 560;
const H = 160;

function SignaturePad({ fontFamily, defaultText, onChange }: { fontFamily: string; defaultText: string; onChange: (png: string) => void }) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState(defaultText);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);

  // A crisp canvas at the screen's pixel density; the PNG comes out at 2x at least.
  useEffect(() => {
    const c = canvas.current!;
    const scale = Math.max(2, window.devicePixelRatio || 1);
    c.width = W * scale;
    c.height = H * scale;
    const ctx = c.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#071A2D";
  }, []);

  function clear() {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, W, H);
    inked.current = false;
    onChange("");
  }

  // Typed signatures are drawn in the handwriting font, so both paths produce the same kind of image.
  useEffect(() => {
    if (mode !== "type") return;
    let cancelled = false;
    (async () => {
      const c = canvas.current!;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      const text = typed.trim();
      if (!text) return onChange("");
      await document.fonts.load(`56px ${fontFamily}`);
      if (cancelled) return;
      ctx.fillStyle = "#071A2D";
      ctx.textBaseline = "middle";
      let size = 56;
      do ctx.font = `${size}px ${fontFamily}`;
      while (ctx.measureText(text).width > W - 40 && (size -= 4) > 20);
      ctx.fillText(text, 20, H / 2);
      onChange(c.toDataURL("image/png"));
    })();
    return () => {
      cancelled = true;
    };
    // Re-run only when the typed text changes (onChange is a fresh function each render).
  }, [mode, typed, fontFamily]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Signature</span>
        <div role="group" aria-label="How to sign" className="inline-flex gap-1 rounded-full border border-line bg-white/60 p-1 text-xs font-semibold">
          {(["draw", "type"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                if (m === "draw") clear();
              }}
              className="rounded-full px-3 py-1.5 text-navy/70 aria-pressed:bg-navy aria-pressed:text-cream"
            >
              {m === "draw" ? "Draw" : "Type"}
            </button>
          ))}
        </div>
      </div>

      {mode === "type" && (
        <input value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={60} aria-label="Type your signature" className={`${field} mb-2`} />
      )}

      <div className="relative mt-2 overflow-hidden rounded-2xl border border-dashed border-navy/25 bg-white">
        <canvas
          ref={canvas}
          aria-label={mode === "draw" ? "Draw your signature here" : "Your typed signature"}
          className={`block aspect-[560/160] w-full ${mode === "draw" ? "cursor-crosshair touch-none" : "pointer-events-none"}`}
          onPointerDown={(e) => {
            if (mode !== "draw") return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            const ctx = e.currentTarget.getContext("2d")!;
            const [x, y] = point(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 0.1, y + 0.1);
            ctx.stroke();
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = e.currentTarget.getContext("2d")!;
            const [x, y] = point(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            inked.current = true;
          }}
          onPointerUp={(e) => {
            if (!drawing.current) return;
            drawing.current = false;
            if (inked.current) onChange(e.currentTarget.toDataURL("image/png"));
          }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-navy/15" />
        {mode === "draw" && (
          <button type="button" onClick={clear} className="absolute top-2 right-3 text-xs font-semibold text-navy/60 underline underline-offset-4 hover:text-navy">
            Clear
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">{mode === "draw" ? "Draw with your mouse, trackpad, or finger." : "Your name in a handwriting style."}</p>
    </div>
  );
}
