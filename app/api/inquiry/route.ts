import { sendEmail } from "@/lib/email";
import { inquiryEmail, parseInquiry } from "@/lib/inquiry";

// ponytail: no rate limit here; add a Vercel Firewall rate-limit rule on /api/inquiry if spam shows up.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never see this field, so pretend success for bots.
  if (form.get("website")) return Response.json({ ok: true });

  const inquiry = parseInquiry(form);
  if ("error" in inquiry) return Response.json(inquiry, { status: 400 });

  const to = process.env.INQUIRY_EMAIL;
  const from = process.env.EMAIL_FROM;
  if (!to || !from) {
    console.error("Inquiry not sent: INQUIRY_EMAIL and EMAIL_FROM must be set.");
    return Response.json({ error: "The inquiry form isn’t available right now. Please try again later." }, { status: 503 });
  }

  try {
    await sendEmail({ to, from, replyTo: inquiry.email, ...inquiryEmail(inquiry) });
  } catch (error) {
    console.error("Inquiry email failed:", error);
    return Response.json({ error: "Your inquiry couldn’t be sent. Please try again in a moment." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
