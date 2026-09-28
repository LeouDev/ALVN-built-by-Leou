"use client";

import { useState, useTransition } from "react";
import { uploadPaymentQr } from "@/app/admin/invoice-actions";

// Any image the browser can open becomes a PNG of at most 1200 px, so the upload and every PDF stay small.
async function toPng(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function PaymentQrUpload({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div>
      <label
        aria-disabled={pending}
        className="inline-flex cursor-pointer items-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-cream hover:bg-navy-soft focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent aria-disabled:pointer-events-none aria-disabled:opacity-60"
      >
        {pending ? "Uploading…" : label}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={pending}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!file) return;
            setError("");
            startTransition(async () => {
              const png = await toPng(file).catch(() => null);
              if (!png || png.size > 900_000) return setError("That image couldn’t be used. Try a screenshot cropped to just the QR code.");
              const form = new FormData();
              form.set("qr", png, "payment-qr.png");
              await uploadPaymentQr(form);
            });
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
}
