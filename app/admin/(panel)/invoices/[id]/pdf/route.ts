import { requireAdmin } from "@/lib/admin";
import { provider } from "@/lib/contracts-db";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { getInvoice } from "@/lib/invoices-db";
import { site } from "@/lib/site";

export async function GET(_request: Request, { params }: RouteContext<"/admin/invoices/[id]/pdf">) {
  await requireAdmin();
  const id = Number((await params).id);
  const inv = Number.isSafeInteger(id) ? await getInvoice(id) : null;
  if (!inv) return new Response("Not found", { status: 404 });
  const pdf = await renderInvoicePdf(inv, provider(), site.url);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`Invoice ${inv.number}.pdf`)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
