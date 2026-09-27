import { parseBooking } from "@/lib/booking";

// The Google side (open times, creating the event and Meet link) runs in an Apps Script web app
// in Leou's Google account: apps-script/Code.gs. BOOKING_SECRET proves the request came from here.
type ScriptReply = { slots?: string[]; ok?: boolean; start?: string; end?: string; error?: string };

async function callScript(payload: object): Promise<ScriptReply | null> {
  const url = process.env.BOOKING_URL;
  const secret = process.env.BOOKING_SECRET;
  if (!url || !secret) return null;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ secret, ...payload }),
    signal: AbortSignal.timeout(25_000),
  });
  return res.json();
}

const notSetUp = () => Response.json({ error: "Booking isn’t set up yet." }, { status: 503 });

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reply = await callScript({ action: "slots" });
    if (!reply) return notSetUp();
    if (!reply.slots) throw new Error(reply.error);
    // A short shared cache keeps the page quick; a stale time is caught when booking.
    return Response.json({ slots: reply.slots }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
  } catch (err) {
    console.error("[booking] couldn't load times:", err);
    return Response.json({ error: "Couldn’t load available times." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.website) return Response.json({ ok: true }); // honeypot: pretend it worked

  const booking = parseBooking(body);
  if ("error" in booking) return Response.json(booking, { status: 400 });

  try {
    const reply = await callScript({ action: "book", ...booking });
    if (!reply) return notSetUp();
    if (reply.error === "taken")
      return Response.json({ error: "Sorry, that time was just taken. Please pick another." }, { status: 409 });
    if (!reply.ok) throw new Error(reply.error);
    return Response.json({ ok: true, start: reply.start, end: reply.end });
  } catch (err) {
    console.error("[booking] couldn't book:", err);
    return Response.json(
      { error: "Your call couldn’t be booked. Please try again, or send an inquiry instead." },
      { status: 502 },
    );
  }
}
