import { requireAdmin } from "@/lib/admin";
import { renderContractPdf } from "@/lib/contract-pdf";
import { pdfName, signedPdf } from "@/lib/contract-signing";
import { getContract } from "@/lib/contracts-db";
import { site } from "@/lib/site";

// Signed contracts: the stored PDF. Drafts and sent contracts: a preview, rendered fresh and not kept.
export async function GET(_request: Request, { params }: RouteContext<"/admin/contracts/[id]/pdf">) {
  await requireAdmin();
  const id = Number((await params).id);
  const c = Number.isSafeInteger(id) ? await getContract(id) : null;
  if (!c) return new Response("Not found", { status: 404 });
  const pdf = c.status === "signed" ? await signedPdf(c) : await renderContractPdf(c, site.url);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(pdfName(c))}`,
      "Cache-Control": "private, no-store",
    },
  });
}
