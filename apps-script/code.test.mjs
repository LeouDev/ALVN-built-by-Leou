import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Runs the Apps Script file in a sandbox with just enough of Google's services stubbed out.
function load(items = [], busy = []) {
  const props = new Map();
  const sent = [];
  const triggers = [];
  const inserted = []; // [event, calendarId, options], copied out of the sandbox
  const ctx = vm.createContext({
    Calendar: {
      Events: {
        list: () => ({ timeZone: "Asia/Manila", items }),
        insert: (...args) => (inserted.push(JSON.parse(JSON.stringify(args))), { id: `evt${inserted.length}`, hangoutLink: "https://meet.google.com/abc-defg-hij" }),
      },
      // Busy = the given times plus everything booked so far.
      Freebusy: {
        query: () => ({ calendars: { primary: { busy: [...busy, ...inserted.map(([e]) => ({ start: e.start.dateTime, end: e.end.dateTime }))] } } }),
      },
    },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (content) => ({ content, setMimeType() { return this; } }) },
    MailApp: { sendEmail: (to, subject, text, opts) => sent.push(typeof to === "object" ? { ...to } : { to, subject, text, ...opts }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: {
      formatDate: (d, tz, pattern) => `${pattern}`,
      getUuid: () => "uuid",
      base64Decode: (b64) => [...Buffer.from(b64, "base64")],
      newBlob: (bytes, type, name) => ({ bytes: bytes.length, type, name }),
    },
    console: { error() {} },
    ScriptApp: {
      getProjectTriggers: () => [...triggers],
      deleteTrigger: (t) => triggers.splice(triggers.indexOf(t), 1),
      newTrigger: (fn) => ({
        timeBased: () => ({ everyMinutes: (every) => ({ create: () => triggers.push({ fn, every }) }) }),
        forUserCalendar: (calendar) => ({ onEventUpdated: () => ({ create: () => triggers.push({ fn, calendar }) }) }),
      }),
    },
    Logger: { log() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => "leou@example.com" }) },
  });
  vm.runInContext(readFileSync(new URL("./Code.gs", import.meta.url), "utf8"), ctx);
  return { ctx, props, sent, triggers, inserted };
}

const ago = (min) => new Date(Date.now() - min * 6e4).toISOString();
const booking = (id, extra = {}) => ({
  id,
  status: "confirmed",
  summary: "30-min intro call with Leou",
  created: ago(2),
  start: { dateTime: "2026-09-28T10:00:00+08:00" },
  end: { dateTime: "2026-09-28T10:30:00+08:00" },
  hangoutLink: "https://meet.google.com/abc-defg-hij",
  attendees: [{ email: "leou@example.com", self: true, organizer: true }, { email: `${id}@example.com`, displayName: "Ana<script> Cruz" }],
  ...extra,
});

test("setup replaces triggers and starts from now", () => {
  const { ctx, props, triggers } = load([]);
  ctx.setup();
  ctx.setup();
  assert.deepEqual(triggers, [
    { fn: "sendBookingEmails", calendar: "leou@example.com" },
    { fn: "sendBookingEmails", every: 5 },
  ]);
  assert.ok(Date.now() - new Date(props.get("since")) < 1000);
});

test("emails each new booking once, and only bookings", () => {
  const { ctx, props, sent } = load([
    booking("new"),
    booking("before-setup", { created: ago(120) }),
    booking("cancelled", { status: "cancelled" }),
    booking("other-event", { summary: "Dentist" }),
    booking("schedule-block", { attendees: undefined }),
    booking("meet-pending", { hangoutLink: undefined }),
    booking("meet-never", { hangoutLink: undefined, created: ago(20) }),
  ]);
  props.set("since", ago(60));
  ctx.sendBookingEmails();
  ctx.sendBookingEmails();

  assert.deepEqual(sent.map((m) => m.to), ["new@example.com", "meet-never@example.com"]);
  const [withMeet, noMeet] = sent;
  assert.equal(withMeet.name, "ALVN Built by Leou");
  assert.match(withMeet.htmlBody, /href="https:\/\/meet\.google\.com\/abc-defg-hij"/);
  assert.match(withMeet.htmlBody, /Hi Ana&lt;script&gt;,/);
  assert.doesNotMatch(withMeet.htmlBody, /<script>/);
  assert.match(withMeet.text, /^Hi Ana<script>,/);
  assert.match(withMeet.htmlBody, /unknown sender/);
  assert.match(noMeet.htmlBody, /The Google Meet link is in your calendar invite/);
  assert.doesNotMatch(noMeet.htmlBody, /Join Google Meet/);
});

test("greets without a name when Google doesn't give one", () => {
  const { ctx, props, sent } = load([booking("anon", { attendees: [{ email: "anon@example.com" }] })]);
  props.set("since", ago(60));
  ctx.sendBookingEmails();
  assert.match(sent[0].text, /^Hi there,/);
});

test("takes the first name from Google's booking title", () => {
  const { ctx, props, sent } = load([booking("maya", { summary: "30-min intro call with Leou (Maya Reyes)", attendees: [{ email: "maya@example.com" }] })]);
  props.set("since", ago(60));
  ctx.sendBookingEmails();
  assert.match(sent[0].text, /^Hi Maya,/);
});

test("offers weekday times in working hours, after the notice period, around busy times", () => {
  const { ctx } = load();
  const now = Date.parse("2026-09-28T00:00:00+08:00"); // Monday midnight in Manila
  const busy = [{ start: Date.parse("2026-09-28T14:00:00+08:00"), end: Date.parse("2026-09-28T15:00:00+08:00") }];
  const slots = [...ctx.openSlots_(busy, now)];
  const on = (date) => slots.filter((s) => s.startsWith(date)).map((s) => s.slice(11, 16)); // UTC times; Manila is UTC+8

  // Monday: 12 hours' notice → from noon; 2:00–3:00 PM is busy; last call starts 4:30 PM.
  assert.deepEqual(on("2026-09-28"), ["04:00", "04:30", "05:00", "05:30", "07:00", "07:30", "08:00", "08:30"]);
  // Tuesday: the full 9:00 AM–5:00 PM, 16 calls.
  assert.equal(on("2026-09-29").length, 16);
  assert.equal(on("2026-09-29")[0], "01:00");
  // No weekends, nothing past two weeks.
  assert.deepEqual([...on("2026-10-03"), ...on("2026-10-04")], []);
  assert.ok(slots.every((s) => Date.parse(s) < now + 15 * 864e5));
});

test("the web app checks the secret, books only open times, and never double-books", () => {
  const { ctx, props, sent, inserted } = load();
  props.set("BOOKING_SECRET", "s3cret");
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret: "s3cret", ...body }) } }).content);

  assert.deepEqual(call({ secret: "wrong", action: "slots" }), { error: "unauthorized" });
  const { slots } = call({ action: "slots" });
  assert.ok(slots.length > 0);
  const booking = { action: "book", start: slots[0], name: "Maya  Reyes", email: "maya@example.com", note: "A shop website" };
  assert.deepEqual(call({ ...booking, email: "nope" }), { error: "invalid" });
  assert.deepEqual(call({ ...booking, start: "2026-01-01T00:00:00.000Z" }), { error: "taken" });

  assert.equal(call(booking).ok, true);
  const [event, calendarId, options] = inserted[0];
  assert.equal(calendarId, "primary");
  assert.equal(event.summary, "30-min intro call with Leou (Maya Reyes)");
  assert.deepEqual(event.attendees, [{ email: "maya@example.com", displayName: "Maya Reyes" }]);
  assert.equal(event.conferenceData.createRequest.conferenceSolutionKey.type, "hangoutsMeet");
  assert.deepEqual(options, { conferenceDataVersion: 1, sendUpdates: "all" });
  assert.equal(sent[0].to, "leou@example.com"); // Leou hears about it
  assert.equal(sent[0].replyTo, "maya@example.com");
  assert.match(sent[0].body, /A shop website/);

  assert.deepEqual(call(booking), { error: "taken" });
  assert.equal(inserted.length, 1);
  assert.ok(!call({ action: "slots" }).slots.includes(slots[0]));
});

test("lists booked calls for the admin calendar, with the guest's details", () => {
  const { ctx, props } = load([
    booking("call1", { description: "A shop website\n\nBooked on https://alvn-built-by-leou.vercel.app/contact", htmlLink: "https://calendar.google.com/event?eid=1" }),
    booking("call2", { summary: "30-min intro call with Leou (Lea Fernandez)", attendees: [{ email: "lea@example.com", responseStatus: "declined" }], hangoutLink: undefined }),
    booking("other", { summary: "Dentist" }),
    booking("gone", { status: "cancelled" }),
  ]);
  props.set("BOOKING_SECRET", "s3cret");
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret: "s3cret", ...body }) } }).content);

  const { bookings } = call({ action: "bookings", from: "2026-09-01T00:00:00Z", to: "2026-10-01T00:00:00Z" });
  assert.deepEqual(bookings.map((b) => b.id), ["call1", "call2"]);
  assert.deepEqual(bookings[0], {
    id: "call1",
    start: "2026-09-28T10:00:00+08:00",
    end: "2026-09-28T10:30:00+08:00",
    name: "Ana<script> Cruz",
    email: "call1@example.com",
    note: "A shop website",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    link: "https://calendar.google.com/event?eid=1",
    response: "",
  });
  assert.equal(bookings[1].name, "Lea Fernandez");
  assert.equal(bookings[1].response, "declined");
  assert.deepEqual(call({ action: "bookings", from: "2026-09-01", to: "2027-09-01" }), { error: "server" }); // too wide
});

test("sends admin replies from Gmail, escaping the HTML copy", () => {
  const { ctx, props, sent } = load();
  props.set("BOOKING_SECRET", "s3cret");
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret: "s3cret", action: "reply", ...body }) } }).content);

  assert.deepEqual(call({ to: "nope", subject: "Re: Your project inquiry", text: "Hi" }), { error: "invalid" });
  assert.deepEqual(call({ to: "maya@example.com", subject: "Re: Your project inquiry", text: "  " }), { error: "invalid" });
  assert.deepEqual(call({ to: "maya@example.com", subject: "Re: Your\nproject inquiry", text: "Hi <Maya>\n> quoted" }), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "maya@example.com");
  assert.equal(sent[0].subject, "Re: Your project inquiry");
  assert.equal(sent[0].name, "ALVN Built by Leou");
  assert.match(sent[0].htmlBody, /Hi &lt;Maya&gt;<br>&gt; quoted/);
});

test("sends contract emails with custom HTML and a PDF attachment", () => {
  const { ctx, props, sent } = load();
  props.set("BOOKING_SECRET", "s3cret");
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret: "s3cret", ...body }) } }).content);
  const pdf = Buffer.from("%PDF-1.4 test").toString("base64");
  assert.deepEqual(call({ action: "send", to: "maya@example.com", subject: "Signed: Website Agreement", text: "Here’s your copy.", html: "<p>Branded</p>", attachments: [{ name: "Agreement.pdf", base64: pdf }] }), { ok: true });
  assert.equal(sent[0].htmlBody, "<p>Branded</p>");
  assert.deepEqual([...sent[0].attachments], [{ bytes: 13, type: "application/pdf", name: "Agreement.pdf" }]);
});
