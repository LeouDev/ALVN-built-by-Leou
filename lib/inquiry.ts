// Shared by the inquiry form (options) and the /api/inquiry route (validation + email).
// Keep this file free of path aliases so `npm test` can import it directly with Node.

export const PROJECT_TYPES = [
  "Website",
  "Web Application",
  "Mobile Application",
  "E-commerce",
  "Internal Tool",
  "Landing Page",
  "Other",
] as const;

export const BUDGETS = [
  "Under ₱25,000",
  "₱25,000 – ₱50,000",
  "₱50,000 – ₱100,000",
  "₱100,000 – ₱250,000",
  "₱250,000+",
  "Not sure yet",
] as const;

export const TIMELINES = ["ASAP", "1 Month", "1–3 Months", "3–6 Months", "Flexible"] as const;

export type Inquiry = {
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  budget: string;
  timeline: string;
};

export const MESSAGE_MAX = 5000;
const oneOf = (list: readonly string[], value: string) => list.includes(value);

export function parseInquiry(form: FormData): Inquiry | { error: string } {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const i: Inquiry = {
    name: get("name").replace(/\s+/g, " "),
    email: get("email"),
    company: get("company").replace(/\s+/g, " "),
    projectType: get("projectType"),
    message: get("message"),
    budget: get("budget"),
    timeline: get("timeline"),
  };

  if (!i.name || i.name.length > 120) return { error: "Please enter your name." };
  if (i.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email))
    return { error: "Please enter a valid email address." };
  if (i.company.length > 160) return { error: "Please shorten the company name." };
  if (!oneOf(PROJECT_TYPES, i.projectType)) return { error: "Please choose what you’re looking to build." };
  if (!i.message) return { error: "Please tell me a little about your project." };
  if (i.message.length > MESSAGE_MAX) return { error: `Please keep your message under ${MESSAGE_MAX} characters.` };
  if (i.budget && !oneOf(BUDGETS, i.budget)) return { error: "Please choose a budget from the list." };
  if (i.timeline && !oneOf(TIMELINES, i.timeline)) return { error: "Please choose a timeline from the list." };
  return i;
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function inquiryEmail(i: Inquiry) {
  const rows: [string, string][] = [
    ["Name", i.name],
    ["Email", i.email],
    ["Company", i.company || "—"],
    ["Building", i.projectType],
    ["Budget", i.budget || "—"],
    ["Timeline", i.timeline || "—"],
  ];
  const subject = `New inquiry: ${i.projectType} — ${i.name}`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", i.message, "", "Reply to this email to respond directly."].join("\n");

  const cell = (k: string, v: string) =>
    k === "Email" ? `<a href="mailto:${escapeHtml(v)}" style="color:#071A2D">${escapeHtml(v)}</a>` : escapeHtml(v);
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F3EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#071A2D">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(7,26,45,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="background:#071A2D;padding:28px 32px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#F47721">New project inquiry</div>
      <div style="margin-top:10px;font-size:22px;font-weight:700;color:#F7F3EA">${escapeHtml(i.projectType)} · ${escapeHtml(i.name)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">
        ${rows.map(([k, v]) => `<tr><td style="padding:7px 0;width:96px;color:#5F6B7E;vertical-align:top">${k}</td><td style="padding:7px 0;font-weight:600">${cell(k, v)}</td></tr>`).join("\n        ")}
      </table>
      <div style="margin-top:24px;padding:20px 22px;background:#F7F3EA;border-radius:14px;font-size:15px;line-height:1.65">${escapeHtml(i.message).replace(/\r?\n/g, "<br>")}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#5F6B7E">Reply to this email to respond to ${escapeHtml(i.name)} directly.</p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#5F6B7E">ALVN — Built by Leou · Sent from the inquiry form</p>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
