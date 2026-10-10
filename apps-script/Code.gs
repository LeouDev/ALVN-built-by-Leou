/**
 * build bookings (Google Apps Script)
 *
 * Runs in Leou's Google account and powers the "Book a call" calendar on the site's Contact page:
 *   - The site asks this web app for open 30-minute times. Anything on your calendar is skipped.
 *   - Booking a time creates the event with a Google Meet link. Google emails the client the
 *     invite, and you get an email about the new booking.
 *   - Each booker also gets a branded "You're booked" email from your Gmail, sent with Google's
 *     invite. If the Meet link isn't ready yet, sendBookingEmails sends it once the link lands.
 *   - The site's admin reads booked calls for its calendar, and sends email from your Gmail:
 *     inbox replies and contracts (with the signed PDF attached).
 *
 * Setup, once (the repo copy of this project lives in apps-script/):
 *   1. script.google.com → New project, named "build booking emails".
 *   2. Replace everything in Code.gs with this file, then click Save.
 *   3. Add the Google Calendar API service: Services + → Google Calendar API → Add. If the + won't
 *      respond: Project Settings (gear) → tick "Show appsscript.json manifest file in editor", then
 *      replace that file with apps-script/appsscript.json.
 *   4. Project Settings → Script Properties → add BOOKING_SECRET, the same value as the site's
 *      BOOKING_SECRET in Vercel.
 *   5. Choose `setup` in the toolbar and click Run, then allow the permissions it asks for.
 *      "Google hasn't verified this app" is expected for your own script:
 *      click Advanced → Go to build booking emails.
 *   6. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Deploy, and put
 *      the Web app URL (it ends in /exec) in the site's BOOKING_URL in Vercel.
 *
 * After pasting a new version of this file, run `setup` once more, then Deploy → Manage deployments
 * → Edit (pencil) → Version: New version → Deploy. Until then the web app keeps running the old code.
 * Tests: apps-script/code.test.mjs (npm test).
 */

const SCHEDULE_TITLE = "30-min intro call with Leou"; // booked events are titled "<this> (<name>)"
const CALENDAR_ID = "primary";
const SITE_URL = "https://www.builtbyleou.info";
const SENDER_NAME = "build by Leou"; // plain ASCII: some Gmail paths garble symbols in sender names

// Bookable times: weekdays, 9:00 AM–5:00 PM Manila time, in 30-minute calls.
const TIME_ZONE = "Asia/Manila";
const UTC_OFFSET_HOURS = 8; // ponytail: fixed offset (Manila has no daylight saving); work it out per day if TIME_ZONE ever changes to a zone that has it
const WORK_DAYS = [1, 2, 3, 4, 5]; // 0 = Sunday … 6 = Saturday
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;
const SLOT_MINUTES = 30;
const MIN_NOTICE_HOURS = 12;
const DAYS_AHEAD = 14;

function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendBookingEmails").forUserCalendar(Session.getEffectiveUser().getEmail()).onEventUpdated().create();
  ScriptApp.newTrigger("sendBookingEmails").timeBased().everyMinutes(5).create();
  // Only bookings made from now on get the email.
  PropertiesService.getScriptProperties().setProperty("since", new Date().toISOString());
  Logger.log("All set: new bookings get the build email right after Google's invite.");
}

function sendBookingEmails() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const since = new Date(props.getProperty("since") || Date.now());
    // ponytail: one page of up to 250 events updated in the last 2 days; plenty for a personal calendar checked every 5 minutes.
    const res = Calendar.Events.list(CALENDAR_ID, {
      updatedMin: new Date(Math.max(since.getTime(), Date.now() - 2 * 864e5)).toISOString(),
      maxResults: 250,
    });
    for (const event of res.items || []) {
      const guest = bookingGuest_(event, since);
      if (!guest || props.getProperty("sent:" + event.id)) continue;
      // The Meet link can land a moment after the booking; wait up to 15 minutes for it.
      if (!event.hangoutLink && Date.now() - new Date(event.created).getTime() < 15 * 6e4) continue;
      send_(event, guest, res.timeZone);
      props.setProperty("sent:" + event.id, new Date().toISOString());
    }
  } finally {
    lock.releaseLock();
  }
}

/** The site's /api/booking route calls this web app with {secret, action: "slots" | "book", ...}. */
function doPost(e) {
  let result;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const secret = PropertiesService.getScriptProperties().getProperty("BOOKING_SECRET");
    if (!secret || body.secret !== secret) result = { error: "unauthorized" };
    else if (body.action === "slots") result = { slots: openSlots_(busyTimes_(), Date.now()) };
    else if (body.action === "book") result = book_(body);
    else if (body.action === "bookings") result = { bookings: bookings_(body.from, body.to) };
    else if (body.action === "send" || body.action === "reply") result = sendEmail_(body);
    else result = { error: "unknown action" };
  } catch (err) {
    console.error(err);
    result = { error: "server" };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/** Open start times (ISO strings) in the booking window, skipping busy times. */
function openSlots_(busy, now) {
  const hour = 36e5, day = 864e5, slot = SLOT_MINUTES * 6e4, offset = UTC_OFFSET_HOURS * hour;
  const earliest = now + MIN_NOTICE_HOURS * hour;
  const today = Math.floor((now + offset) / day) * day - offset; // local midnight
  const slots = [];
  for (let d = 0; d <= DAYS_AHEAD; d++) {
    const midnight = today + d * day;
    if (!WORK_DAYS.includes(new Date(midnight + offset).getUTCDay())) continue;
    for (let t = midnight + DAY_START_HOUR * hour; t + slot <= midnight + DAY_END_HOUR * hour; t += slot) {
      if (t >= earliest && !busy.some((b) => b.start < t + slot && b.end > t)) slots.push(new Date(t).toISOString());
    }
  }
  return slots;
}

function busyTimes_() {
  const now = Date.now();
  const res = Calendar.Freebusy.query({
    timeMin: new Date(now).toISOString(),
    timeMax: new Date(now + (DAYS_AHEAD + 2) * 864e5).toISOString(),
    items: [{ id: CALENDAR_ID }],
  });
  const calendar = Object.values(res.calendars)[0];
  if (calendar.errors) throw new Error(JSON.stringify(calendar.errors));
  return (calendar.busy || []).map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));
}

function book_(body) {
  const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const email = String(body.email || "").trim();
  const note = String(body.note || "").trim().slice(0, 1000);
  const start = String(body.start || "");
  if (!name || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid" };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: "busy" };
  try {
    // Checked again under the lock, so two people can't book the same time.
    if (!openSlots_(busyTimes_(), Date.now()).includes(start)) return { error: "taken" };
    const end = new Date(new Date(start).getTime() + SLOT_MINUTES * 6e4).toISOString();
    const event = Calendar.Events.insert(
      {
        summary: `${SCHEDULE_TITLE} (${name})`,
        description: [note, `Booked on ${SITE_URL}/contact`].filter(Boolean).join("\n\n"),
        start: { dateTime: start, timeZone: TIME_ZONE },
        end: { dateTime: end, timeZone: TIME_ZONE },
        attendees: [{ email, displayName: name }],
        conferenceData: { createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      },
      CALENDAR_ID,
      { conferenceDataVersion: 1, sendUpdates: "all" },
    );
    // Google is emailing its invite now: send the branded email alongside it. If this fails, or the
    // Meet link isn't ready, sendBookingEmails sends it later (the "sent:" mark stops a second copy).
    if (event.hangoutLink) {
      try {
        send_({ start: { dateTime: start }, end: { dateTime: end }, hangoutLink: event.hangoutLink }, { email, displayName: name }, TIME_ZONE);
        PropertiesService.getScriptProperties().setProperty("sent:" + event.id, new Date().toISOString());
      } catch (err) {
        console.error(err);
      }
    }
    const when = Utilities.formatDate(new Date(start), TIME_ZONE, "EEE, MMM d 'at' h:mm a");
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      replyTo: email,
      subject: `New call booked: ${name}, ${when}`,
      body: [
        `${name} (${email}) booked a 30-min intro call.`, "",
        `When: ${when} (Manila time)`, `Google Meet: ${event.hangoutLink || "see the calendar event"}`,
        ...(note ? ["", "Their note:", note] : []), "",
        "It's on your Google Calendar. Reply to this email to reach them directly.",
      ].join("\n"),
    });
    return { ok: true, start, end };
  } finally {
    lock.releaseLock();
  }
}

/** Booked intro calls between two dates, for the admin calendar. */
function bookings_(from, to) {
  const timeMin = new Date(from), timeMax = new Date(to);
  if (!(timeMax > timeMin) || timeMax - timeMin > 100 * 864e5) throw new Error("bad range");
  const res = Calendar.Events.list(CALENDAR_ID, {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  return (res.items || [])
    .filter((e) => e.status !== "cancelled" && (e.summary || "").startsWith(SCHEDULE_TITLE) && e.start && e.start.dateTime)
    .map((e) => {
      const guest = (e.attendees || []).find((a) => !a.self && !a.resource) || {};
      return {
        id: e.id,
        start: e.start.dateTime,
        end: e.end.dateTime,
        name: guest.displayName || ((e.summary.match(/\(([^()]+)\)\s*$/) || [])[1]) || "",
        email: guest.email || "",
        note: (e.description || "").replace(/\s*Booked on \S+$/, "").trim(),
        meetUrl: e.hangoutLink || "",
        link: e.htmlLink || "",
        response: guest.responseStatus || "",
      };
    });
}

/** Sends an email from Leou's Gmail for the admin (inbox replies, contracts). The site writes the
 *  text, and optionally the HTML and PDF attachments ({ name, base64 }). */
function sendEmail_(body) {
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const text = String(body.text || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || !text.trim()) return { error: "invalid" };
  const attachments = (body.attachments || [])
    .slice(0, 3)
    .map((a) => Utilities.newBlob(Utilities.base64Decode(String(a.base64)), "application/pdf", String(a.name || "document.pdf")));
  MailApp.sendEmail(to, subject, text, {
    name: SENDER_NAME,
    htmlBody: body.html
      ? String(body.html)
      : `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0E0E0E">${esc_(text).replace(/\n/g, "<br>")}</div>`,
    attachments,
  });
  return { ok: true };
}

function sendTestEmail() {
  const start = new Date(Date.now() + 864e5);
  const end = new Date(start.getTime() + 30 * 6e4);
  send_(
    { start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, hangoutLink: "https://meet.google.com/abc-defg-hij" },
    { email: Session.getEffectiveUser().getEmail(), displayName: "Leou" },
    CalendarApp.getTimeZone(),
  );
}

/** The person who booked, if this event is a new booking of the intro call. */
function bookingGuest_(event, since) {
  if (event.status === "cancelled" || !(event.summary || "").startsWith(SCHEDULE_TITLE)) return null;
  if (!event.start || !event.start.dateTime || new Date(event.created) < since) return null;
  return (event.attendees || []).find((a) => !a.self && !a.resource) || null;
}

function send_(event, guest, timeZone) {
  const at = (iso, pattern) => Utilities.formatDate(new Date(iso), timeZone, pattern);
  // Google titles bookings "<schedule title> (<booker's name>)".
  const titleName = ((event.summary || "").match(/\(([^()]+)\)\s*$/) || [])[1];
  const email = bookingEmail_({
    name: (guest.displayName || titleName || "").trim().split(/\s+/)[0],
    day: at(event.start.dateTime, "EEEE, MMMM d"),
    start: at(event.start.dateTime, "h:mm a"),
    end: at(event.end.dateTime, "h:mm a"),
    zone: at(event.start.dateTime, "'GMT'XXX"),
    meetUrl: event.hangoutLink || "",
  });
  MailApp.sendEmail(guest.email, email.subject, email.text, { htmlBody: email.html, name: SENDER_NAME });
}

const esc_ = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function bookingEmail_({ name, day, start, end, zone, meetUrl }) {
  const hi = name ? `Hi ${name},` : "Hi there,";
  const when = `${day} · ${start} – ${end} (${zone})`;
  const intro = "Thanks for booking a call. I’m looking forward to hearing what you’re building.";
  const prep = ["What you’re building and who it’s for", "Links, screenshots, or apps you like", "Your timeline and a rough budget"];
  const invite = "Google may label my calendar invite as coming from an “unknown sender” because we haven’t emailed before. Tap “Add to calendar” to save it.";
  const change = "Need a different time? Just reply to this email.";

  const subject = `You’re booked: ${day} at ${start}`;
  const text = [
    hi, "", intro, "",
    SCHEDULE_TITLE, `When: ${when}`, `Google Meet: ${meetUrl || "the link is in your calendar invite"}`, "", invite, "",
    "To make the most of our 30 minutes, bring:", ...prep.map((p) => `- ${p}`), "",
    change, "", "Talk soon,", "Leou", `build — Built by Leou · ${SITE_URL}`,
  ].join("\n");

  const meet = meetUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td style="background:#0E0E0E;border-radius:999px">
            <a href="${esc_(meetUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0E0E0E;text-decoration:none">Join Google Meet →</a>
          </td></tr></table>
          <p style="margin:10px 0 0;font-size:13px;color:#66635C">${esc_(meetUrl.replace(/^https?:\/\//, ""))}</p>`
    : `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;font-weight:600">The Google Meet link is in your calendar invite.</p>`;

  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F2EFE8">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc_(when)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;padding:32px 16px;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0E0E0E">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px">
      <a href="${SITE_URL}"><img src="${SITE_URL}/brand/alvn-wordmark.png" width="112" height="33" alt="build" style="display:block;border:0"></a>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(14,14,14,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="background:#0E0E0E;padding:28px 32px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#0E0E0E">You’re booked</div>
      <div style="margin-top:10px;font-size:24px;line-height:1.25;font-weight:700;color:#F2EFE8">${esc_(SCHEDULE_TITLE)}</div>
      <div style="margin-top:8px;font-size:15px;line-height:1.5;color:#CFCCC4">${esc_(day)}<br>${esc_(`${start} – ${end} (${zone})`)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px 32px">
      <p style="margin:0;font-size:16px;line-height:1.6">${esc_(hi)}</p>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.6">${esc_(intro)}</p>
      ${meet}
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#66635C">${esc_(invite)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F2EFE8;border-radius:14px">
        <tr><td style="padding:20px 22px">
          <div style="font-size:14px;font-weight:700">To make the most of our 30 minutes, bring:</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px;font-size:15px;line-height:1.5">
            ${prep.map((p) => `<tr><td valign="top" style="padding:6px 10px 0 0;color:#0E0E0E">✦</td><td style="padding-top:6px">${esc_(p)}</td></tr>`).join("\n            ")}
          </table>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#66635C">${esc_(change)}</p>
      <p style="margin:24px 0 0;font-size:16px;line-height:1.6">Talk soon,<br><strong>Leou</strong></p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#66635C">build — Built by Leou · <a href="${SITE_URL}" style="color:#66635C">${SITE_URL.replace("https://", "")}</a></p>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
