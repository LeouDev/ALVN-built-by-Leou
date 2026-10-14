import { requireAdmin } from "@/lib/admin";
import { provider } from "@/lib/contracts-db";
import { renderInvoicePdf, renderReceiptPdf } from "@/lib/invoice-pdf";
import { getInvoice, getPaymentQr } from "@/lib/invoices-db";
import { site } from "@/lib/site";

// ?receipt=1 serves the acknowledgement receipt instead (paid invoices only).
export async function GET(request: Request, { params }: RouteContext<"/admin/invoices/[id]/pdf">) {
  await requireAdmin();
  const id = Number((await params).id);
  const inv = Number.isSafeInteger(id) ? await getInvoice(id) : null;
  if (!inv) return new Response("Not found", { status: 404 });
  const receipt = inv.status === "paid" && new URL(request.url).searchParams.has("receipt");
  const pdf = receipt ? await renderReceiptPdf(inv, provider(), site.url) : await renderInvoicePdf(inv, provider(), site.url, await getPaymentQr());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${receipt ? "Acknowledgement Receipt" : "Billing Statement"} ${inv.number}.pdf`)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
