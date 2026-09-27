import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Runs the Apps Script file in a sandbox with just enough of Google's services stubbed out.
function load(items) {
  const props = new Map();
  const sent = [];
  const triggers = [];
  const ctx = vm.createContext({
    Calendar: { Events: { list: () => ({ timeZone: "Asia/Manila", items }) } },
    MailApp: { sendEmail: (to, subject, text, opts) => sent.push({ to, subject, text, ...opts }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate: (d, tz, pattern) => `${pattern}` },
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
  vm.runInContext(readFileSync(new URL("./booking-emails.gs", import.meta.url), "utf8"), ctx);
  return { ctx, props, sent, triggers };
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
  assert.equal(withMeet.name, "Leou · ALVN");
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
