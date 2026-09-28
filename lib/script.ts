// The Apps Script web app in Leou's Google account (apps-script/Code.gs) does everything that needs his
// Google Calendar or Gmail: open times, bookings, the admin calendar, and replies sent from his Gmail.
// BOOKING_SECRET proves the request came from this site. Returns null when it isn't configured.
export async function callScript<T>(payload: object): Promise<T | null> {
  const url = process.env.BOOKING_URL;
  const secret = process.env.BOOKING_SECRET;
  if (!url || !secret) return null;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ secret, ...payload }),
    cache: "no-store",
    signal: AbortSignal.timeout(45_000), // the script can take a while to start after an update
  });
  return res.json();
}
