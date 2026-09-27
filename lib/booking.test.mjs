import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBooking } from "./booking.ts";

const start = "2026-09-29T01:00:00.000Z";

test("accepts a booking and tidies whitespace", () => {
  assert.deepEqual(parseBooking({ start, name: "  Maya   Reyes ", email: "maya@example.com", note: " A shop site " }), {
    start,
    name: "Maya Reyes",
    email: "maya@example.com",
    note: "A shop site",
  });
});

test("rejects bookings with missing or invalid fields", () => {
  for (const body of [
    null,
    {},
    { start: "soon", name: "Maya", email: "maya@example.com" },
    { start, email: "maya@example.com" },
    { start, name: "Maya", email: "not-an-email" },
    { start, name: "Maya", email: "maya@example.com", note: "x".repeat(1001) },
  ])
    assert.ok("error" in parseBooking(body), JSON.stringify(body));
});
