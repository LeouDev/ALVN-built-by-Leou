import { escapeHtml as esc } from "@/lib/inquiry";

// Contract emails, sent from Leou's Gmail through the Apps Script. Same look as the booking email.
function branded({ eyebrow, title, paragraphs, button, siteUrl }: { eyebrow: string; title: string; paragraphs: string[]; button?: { label: string; url: string }; siteUrl: string }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F3EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#071A2D">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px"><img src="${siteUrl}/brand/alvn-wordmark.png" width="112" height="33" alt="ALVN" style="display:block;border:0"></td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(7,26,45,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="background:#071A2D;padding:28px 32px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#F47721">${esc(eyebrow)}</div>
      <div style="margin-top:10px;font-size:24px;line-height:1.25;font-weight:700;color:#F7F3EA">${esc(title)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px 32px">
      ${paragraphs.map((p, i) => `<p style="margin:${i ? 12 : 0}px 0 0;font-size:16px;line-height:1.6">${esc(p)}</p>`).join("\n      ")}
      ${
        button
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td style="background:#F47721;border-radius:999px">
        <a href="${esc(button.url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#071A2D;text-decoration:none">${esc(button.label)} →</a>
      </td></tr></table>`
          : ""
      }
      <p style="margin:24px 0 0;font-size:16px;line-height:1.6">Talk soon,<br><strong>Leou</strong></p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#5F6B7E">ALVN — Built by Leou · <a href="${siteUrl}" style="color:#5F6B7E">${siteUrl.replace(/^https?:\/\//, "")}</a></p>
</td></tr>
</table>
</body></html>`;
}

const first = (name: string) => name.trim().split(/\s+/)[0];

export function signRequestEmail(c: { title: string; client_name: string }, link: string, siteUrl: string) {
  const paragraphs = [
    `Hi ${first(c.client_name)},`,
    `Here’s our agreement, “${c.title}”. I’ve already signed it. Please read it through, and if everything looks right, sign it online: it takes about a minute.`,
    "The link is just for you. If anything should change, reply to this email before signing.",
  ];
  return {
    subject: `Please review and sign: ${c.title}`,
    text: `${paragraphs.join("\n\n")}\n\nReview and sign: ${link}\n\nTalk soon,\nLeou\nALVN — Built by Leou · ${siteUrl}`,
    html: branded({ eyebrow: "Ready to sign", title: c.title, paragraphs, button: { label: "Review and sign", url: link }, siteUrl }),
  };
}

export function signedCopyEmail(c: { title: string; client_name: string }, siteUrl: string) {
  const paragraphs = [
    `Hi ${first(c.client_name)},`,
    `Thanks for signing “${c.title}”. The fully signed agreement is attached as a PDF for your records.`,
    "I’ll be in touch shortly about next steps.",
  ];
  return {
    subject: `Signed: ${c.title}`,
    text: `${paragraphs.join("\n\n")}\n\nTalk soon,\nLeou\nALVN — Built by Leou · ${siteUrl}`,
    html: branded({ eyebrow: "Signed", title: c.title, paragraphs, siteUrl }),
  };
}

export function signedNoticeEmail(c: { id: number; title: string; client_name: string }, adminUrl: string) {
  return {
    subject: `${c.client_name} signed: ${c.title}`,
    text: `${c.client_name} signed “${c.title}”. The signed PDF is attached, and it's in the admin: ${adminUrl}`,
  };
}
