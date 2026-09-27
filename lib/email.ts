// Email provider abstraction. Server-only: imported by the /api/inquiry route handler, never by client code.
// To add a provider, add a function to `providers` and set EMAIL_PROVIDER to its key.

export type Email = { to: string; from: string; replyTo?: string; subject: string; html: string; text: string };

/** `ALVN <hi@example.com>` → { name: "ALVN", email: "hi@example.com" }; a bare address has no name. */
export function parseAddress(value: string): { name?: string; email: string } {
  const m = value.match(/^\s*"?(.*?)"?\s*<\s*([^>\s]+)\s*>\s*$/);
  return m ? { ...(m[1] && { name: m[1] }), email: m[2] } : { email: value.trim() };
}

const providers: Record<string, (email: Email) => Promise<void>> = {
  // Brevo transactional email: https://developers.brevo.com/reference/sendtransacemail
  async brevo(email) {
    const key = process.env.BREVO_API_KEY;
    if (!key) throw new Error("BREVO_API_KEY is not set");
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: parseAddress(email.from),
        to: [{ email: email.to }],
        ...(email.replyTo && { replyTo: { email: email.replyTo } }),
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
  },

  // Local development: prints the email instead of sending it.
  async console(email) {
    console.info(`\n[email] to: ${email.to} · reply-to: ${email.replyTo}\n[email] ${email.subject}\n\n${email.text}\n`);
  },
};

export async function sendEmail(email: Email) {
  const name = process.env.EMAIL_PROVIDER || "brevo";
  if (!Object.hasOwn(providers, name)) throw new Error(`Unknown EMAIL_PROVIDER "${name}"`);
  await providers[name](email);
}
