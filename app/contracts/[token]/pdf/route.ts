import { pdfName, signedPdf } from "@/lib/contract-signing";
import { getContractByToken } from "@/lib/contracts-db";
import { hashToken } from "@/lib/session";

// The client's copy of their signed contract, behind the same one-time link.
export async function GET(_request: Request, { params }: RouteContext<"/contracts/[token]/pdf">) {
  const { token } = await params;
  const c = /^[\w-]{43}$/.test(token) ? await getContractByToken(hashToken(token)) : null;
  if (!c || c.status !== "signed") return new Response("Not found", { status: 404 });
  const pdf = await signedPdf(c);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(pdfName(c))}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
