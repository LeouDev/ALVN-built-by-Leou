/**
 * ALVN booking emails (Google Apps Script)
 *
 * When someone books the 30-min intro call on the site's Contact page, this sends them a
 * branded "You're booked" email from your Gmail. Google's own calendar invite (with the Meet
 * link) still goes out too; that one can't be restyled or turned off.
 *
 * Setup, once:
 *   1. Go to script.google.com → New project, and name it "ALVN booking emails".
 *   2. Replace everything in Code.gs with this file, then click Save.
 *   3. Next to "Services" click + → Google Calendar API → Add. If the + won't respond: Project Settings
 *      (gear) → tick "Show appsscript.json manifest file in editor", then replace that file with
 *      apps-script/appsscript.json.
 *   4. Choose `setup` in the toolbar and click Run, then allow the permissions it asks for.
 *      "Google hasn't verified this app" is expected for your own script:
 *      click Advanced → Go to ALVN booking emails.
 *   5. Optional: run `sendTestEmail` to get a sample in your own inbox.
 *
 * It runs whenever your calendar changes (with a 5-minute backup check), so the email lands right
 * after Google's invite. After pasting a new version of this file, run `setup` once more.
 * Tests: apps-script/booking-emails.test.mjs (npm test).
 */

const SCHEDULE_TITLE = "30-min intro call with Leou"; // must match the appointment schedule's title
const CALENDAR_ID = "primary";
const SITE_URL = "https://alvn-built-by-leou.vercel.app";
const SENDER_NAME = "Leou · ALVN";

function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendBookingEmails").forUserCalendar(Session.getEffectiveUser().getEmail()).onEventUpdated().create();
  ScriptApp.newTrigger("sendBookingEmails").timeBased().everyMinutes(5).create();
  // Only bookings made from now on get the email.
  PropertiesService.getScriptProperties().setProperty("since", new Date().toISOString());
  Logger.log("All set: new bookings get the ALVN email right after Google's invite.");
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

function bookingEmail_({ name, day, start, end, zone, meetUrl }) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const hi = name ? `Hi ${name},` : "Hi there,";
  const when = `${day} · ${start} – ${end} (${zone})`;
  const intro = "Thanks for booking a call. I’m looking forward to hearing what you’re building.";
  const prep = ["What you’re building and who it’s for", "Links, screenshots, or apps you like", "Your timeline and a rough budget"];
  const invite = "Google may label my calendar invite as coming from an “unknown sender” because we haven’t emailed before. Tap “Add to calendar” to save it.";
  const change = "Need a different time? Use the links in the Google Calendar invite, or just reply to this email.";

  const subject = `You’re booked: ${day} at ${start}`;
  const text = [
    hi, "", intro, "",
    SCHEDULE_TITLE, `When: ${when}`, `Google Meet: ${meetUrl || "the link is in your calendar invite"}`, "", invite, "",
    "To make the most of our 30 minutes, bring:", ...prep.map((p) => `- ${p}`), "",
    change, "", "Talk soon,", "Leou", `ALVN — Built by Leou · ${SITE_URL}`,
  ].join("\n");

  const meet = meetUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td style="background:#F47721;border-radius:999px">
            <a href="${esc(meetUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#071A2D;text-decoration:none">Join Google Meet →</a>
          </td></tr></table>
          <p style="margin:10px 0 0;font-size:13px;color:#5F6B7E">${esc(meetUrl.replace(/^https?:\/\//, ""))}</p>`
    : `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;font-weight:600">The Google Meet link is in your calendar invite.</p>`;

  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F7F3EA">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(when)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#071A2D">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px">
      <a href="${SITE_URL}"><img src="${SITE_URL}/brand/alvn-wordmark.png" width="112" height="33" alt="ALVN" style="display:block;border:0"></a>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(7,26,45,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="background:#071A2D;padding:28px 32px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#F47721">You’re booked</div>
      <div style="margin-top:10px;font-size:24px;line-height:1.25;font-weight:700;color:#F7F3EA">${esc(SCHEDULE_TITLE)}</div>
      <div style="margin-top:8px;font-size:15px;line-height:1.5;color:#CFCCC4">${esc(day)}<br>${esc(`${start} – ${end} (${zone})`)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px 32px">
      <p style="margin:0;font-size:16px;line-height:1.6">${esc(hi)}</p>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.6">${esc(intro)}</p>
      ${meet}
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#5F6B7E">${esc(invite)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F7F3EA;border-radius:14px">
        <tr><td style="padding:20px 22px">
          <div style="font-size:14px;font-weight:700">To make the most of our 30 minutes, bring:</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px;font-size:15px;line-height:1.5">
            ${prep.map((p) => `<tr><td valign="top" style="padding:6px 10px 0 0;color:#F47721">✦</td><td style="padding-top:6px">${esc(p)}</td></tr>`).join("\n            ")}
          </table>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#5F6B7E">${esc(change)}</p>
      <p style="margin:24px 0 0;font-size:16px;line-height:1.6">Talk soon,<br><strong>Leou</strong></p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#5F6B7E">ALVN — Built by Leou · <a href="${SITE_URL}" style="color:#5F6B7E">${SITE_URL.replace("https://", "")}</a></p>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
