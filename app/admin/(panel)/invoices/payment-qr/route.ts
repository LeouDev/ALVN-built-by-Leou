import { requireAdmin } from "@/lib/admin";
import { getPaymentQr } from "@/lib/invoices-db";

// The admin's own view of the payment QR. Its URL carries ?v=<upload time>, so it can be cached for good.
export async function GET() {
  await requireAdmin();
  const qr = await getPaymentQr();
  if (!qr) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(qr), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=31536000, immutable" } });
}
