// Shared by the booking calendar and the /api/booking route.
// Keep this file free of path aliases so `npm test` can import it directly with Node.

export const NOTE_MAX = 1000;

export type Booking = { start: string; name: string; email: string; note: string };

export function parseBooking(body: unknown): Booking | { error: string } {
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const get = (key: string) => (typeof b[key] === "string" ? (b[key] as string).trim() : "");
  const booking: Booking = { start: get("start"), name: get("name").replace(/\s+/g, " "), email: get("email"), note: get("note") };

  if (Number.isNaN(Date.parse(booking.start))) return { error: "Please pick a time." };
  if (!booking.name || booking.name.length > 120) return { error: "Please enter your name." };
  if (booking.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email))
    return { error: "Please enter a valid email address." };
  if (booking.note.length > NOTE_MAX) return { error: `Please keep your note under ${NOTE_MAX} characters.` };
  return booking;
}
