// Email provider abstraction. Server-only: imported by the /api/inquiry route handler, never by client code.
// To add a provider, add a function to `providers` and set EMAIL_PROVIDER to its key.

export type Email = { to: string; from: string; replyTo?: string; subject: string; html: string; text: string };

const providers: Record<string, (email: Email) => Promise<void>> = {
  async resend(email) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  },

  // Local development: prints the email instead of sending it.
  async console(email) {
    console.info(`\n[email] to: ${email.to} · reply-to: ${email.replyTo}\n[email] ${email.subject}\n\n${email.text}\n`);
  },
};

export async function sendEmail(email: Email) {
  const name = process.env.EMAIL_PROVIDER || "resend";
  if (!Object.hasOwn(providers, name)) throw new Error(`Unknown EMAIL_PROVIDER "${name}"`);
  await providers[name](email);
}
