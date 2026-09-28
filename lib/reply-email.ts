// The email a client receives when Leou replies from the admin inbox: a branded letter with his
// signature and their original message quoted. Sent from his Gmail through the Apps Script.
// Keep this file free of imports so `npm test` can load it directly with Node.

type Original = { kind: "inquiry" | "booking"; name: string; body: string; created_at: Date | string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Escapes text and turns links and line breaks into HTML: blank lines split paragraphs. */
function paragraphs(text: string, style: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => {
      const html = esc(p)
        .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (url) => `<a href="${url}" style="color:#071A2D;text-decoration:underline">${url}</a>`)
        .replace(/\n/g, "<br>");
      return `<p style="${style}">${html}</p>`;
    })
    .join("\n          ");
}

export function replyEmail(m: Original, reply: string, siteUrl: string) {
  const subject = m.kind === "booking" ? "Re: Our 30-min intro call" : "Re: Your project inquiry";
  const when = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const original = m.body.trim();
  const site = siteUrl.replace(/^https?:\/\//, "");

  const text = `${reply.trim()}\n\n— Leou\nALVN — Built by Leou · ${siteUrl}${original ? `\n\nOn ${when}, ${m.name} wrote:\n${original.replace(/^/gm, "> ")}` : ""}`;

  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F7F3EA">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(reply.trim().slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#071A2D">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px">
      <a href="${esc(siteUrl)}"><img src="${esc(siteUrl)}/brand/alvn-wordmark.png" width="112" height="33" alt="ALVN" style="display:block;border:0"></a>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(7,26,45,0.12);border-radius:20px;overflow:hidden">
    <tr><td style="height:4px;background:#F47721;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:32px 32px 28px">
          ${paragraphs(reply, "margin:0 0 14px;font-size:16px;line-height:1.7")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border-top:1px solid rgba(7,26,45,0.12)">
        <tr><td style="padding-top:18px">
          <div style="font-size:16px;font-weight:700">Leou</div>
          <div style="margin-top:2px;font-size:13px;color:#5F6B7E">ALVN — Built by Leou · Digital Products &amp; Experiences</div>
          <a href="${esc(siteUrl)}" style="display:inline-block;margin-top:8px;font-size:13px;font-weight:700;color:#F47721;text-decoration:none">${esc(site)} →</a>
        </td></tr>
      </table>${
        original
          ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F7F3EA;border-radius:14px">
        <tr><td style="padding:18px 20px;border-left:3px solid #F47721;border-radius:14px">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#5F6B7E">On ${esc(when)}, ${esc(m.name)} wrote</div>
          ${paragraphs(original, "margin:8px 0 0;font-size:14px;line-height:1.6;color:#44516A")}
        </td></tr>
      </table>`
          : ""
      }
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#5F6B7E">Just reply to this email to write back.</p>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}
