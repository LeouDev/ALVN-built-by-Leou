"use server";

import { createPublicKey } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPasskeyChallenge, endSession, PASSKEY_PROMPT_COOKIE, passkeyChallenge, requireAdmin, startSession } from "@/lib/admin";
import { parseProject } from "@/lib/client-projects";
import { createProject, deleteProject, updateProject } from "@/lib/client-projects-db";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/inquiry";
import { addReply, getMessage, setArchived, unreadCount } from "@/lib/inbox";
import { checkCeremony, counterOk, KEY_TYPES, newCredentialId, verifySignature } from "@/lib/passkeys";
import { replyEmail } from "@/lib/reply-email";
import { callScript } from "@/lib/script";
import { hashToken, newLoginToken } from "@/lib/session";
import { site } from "@/lib/site";

/** Emails a one-time sign-in link, but only to ADMIN_EMAIL, and at most once a minute. */
export async function sendLoginLink(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  // The page says the same thing either way, so the form doesn't reveal the admin address.
  const done = () => redirect("/admin/login?sent=1");
  if (!admin || email !== admin) done();

  const [recent] = await sql`select 1 from alvn.login_tokens where created_at > now() - interval '1 minute'`;
  if (recent) done();

  const token = newLoginToken();
  await sql`insert into alvn.login_tokens (hash, expires_at) values (${hashToken(token)}, now() + interval '15 minutes')`;
  const link = `${(await headers()).get("origin") ?? site.url}/admin/login?token=${token}`;
  await sendEmail({
    to: admin!,
    from: process.env.EMAIL_FROM!,
    subject: "Your ALVN admin sign-in link",
    text: `Sign in to the ALVN admin:\n\n${link}\n\nThe link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.`,
    html: `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#071A2D">
      <a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#071A2D;color:#F7F3EA;font-weight:600;text-decoration:none">Sign in to ALVN admin</a>
      <br><br><span style="color:#5F6B7E">The link works once and expires in 15 minutes. If you didn’t ask for it, ignore this email.</span></p>`,
  });
  done();
}

/** Uses up a sign-in link (the page posts it, so email scanners that open links can't spend it). */
export async function signIn(form: FormData) {
  const token = String(form.get("token") ?? "");
  const [used] = token
    ? await sql`update alvn.login_tokens set used_at = now()
                where hash = ${hashToken(token)} and used_at is null and expires_at > now() returning hash`
    : [];
  if (!used) redirect("/admin/login?expired=1");
  await startSession();
  redirect("/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}

// Passkeys (Face ID / Touch ID / fingerprint). Pages hand out signed challenge tokens (lib/session.ts); the
// browser signs one, and each works once: it's recorded in used_passkey_challenges when it's spent.

// Server actions only run when Origin matches the host, so it names this site.
const requestOrigin = async () => (await headers()).get("origin") ?? site.url;

/** A fresh challenge, for a page that has been open longer than its challenge lasts. */
export async function newPasskeyChallenge() {
  return passkeyChallenge();
}

/** Spends a challenge the browser signed: it must be ours, unexpired and unused. */
async function spendChallenge(challenge: string) {
  const expires = checkPasskeyChallenge(challenge);
  if (!expires) throw new Error("Challenge expired or not ours");
  await sql`delete from alvn.used_passkey_challenges where expires_at < now()`;
  const [fresh] = await sql`insert into alvn.used_passkey_challenges (hash, expires_at)
    values (${hashToken(challenge)}, ${new Date(expires)}) on conflict do nothing returning hash`;
  if (!fresh) throw new Error("Challenge already used");
}

export type NewPasskey = { id: string; clientDataJSON: string; authenticatorData: string; publicKey: string; algorithm: number };

/** Saves a passkey made on this device. Returns an error message instead of throwing, for the page to show. */
export async function savePasskey(passkey: NewPasskey) {
  await requireAdmin();
  try {
    const { challenge, signCount } = checkCeremony("webauthn.create", await requestOrigin(), passkey.clientDataJSON, passkey.authenticatorData);
    const key = createPublicKey({ key: Buffer.from(passkey.publicKey, "base64url"), format: "der", type: "spki" }); // throws unless it's a public key
    if (newCredentialId(passkey.authenticatorData) !== passkey.id || key.asymmetricKeyType !== KEY_TYPES[passkey.algorithm])
      throw new Error("Unexpected passkey");
    await spendChallenge(challenge);
    await sql`insert into alvn.passkeys (id, public_key, algorithm, sign_count)
              values (${passkey.id}, ${passkey.publicKey}, ${passkey.algorithm}, ${signCount}) on conflict (id) do nothing`;
    return {};
  } catch (error) {
    console.error("[passkey] setup failed:", error);
    return { error: "That didn’t work. Try again." };
  }
}

/** Hides the inbox's passkey offer on this device. */
export async function dismissPasskeyPrompt() {
  await requireAdmin();
  (await cookies()).set(PASSKEY_PROMPT_COOKIE, "dismissed", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 365 * 86400,
  });
}

export type PasskeyAssertion = { id: string; clientDataJSON: string; authenticatorData: string; signature: string };

/** Signs in with a passkey. Returns an error message instead of throwing, for the page to show. */
export async function passkeySignIn(assertion: PasskeyAssertion) {
  try {
    const { challenge, signCount } = checkCeremony("webauthn.get", await requestOrigin(), assertion.clientDataJSON, assertion.authenticatorData);
    const [key] = await sql<{ public_key: string; algorithm: number; sign_count: string }[]>`
      select public_key, algorithm, sign_count from alvn.passkeys where id = ${assertion.id}`;
    if (!key) throw new Error("Unknown passkey");
    if (!verifySignature(key.public_key, key.algorithm, assertion.clientDataJSON, assertion.authenticatorData, assertion.signature))
      throw new Error("Bad signature");
    if (!counterOk(Number(key.sign_count), signCount)) throw new Error("Counter went backwards (cloned passkey?)");
    await spendChallenge(challenge);
    await sql`update alvn.passkeys set sign_count = ${signCount}, last_used_at = now() where id = ${assertion.id}`;
  } catch (error) {
    console.error("[passkey] sign-in failed:", error);
    return { error: "That passkey didn’t work. Try again, or use the email link." };
  }
  await startSession();
  return {};
}

/** Fresh unread count for the admin nav, which stays mounted between pages. */
export async function unreadNow() {
  await requireAdmin();
  return unreadCount();
}

export async function archive(id: number, archived: boolean) {
  await requireAdmin();
  await setArchived(id, archived);
  redirect(archived ? "/admin" : `/admin/messages/${id}`);
}

/** Sends Leou's reply from his Gmail (through the Apps Script) and keeps a copy with the message.
 *  On failure it returns the text, so the form can put it back. */
export async function reply(id: number, _state: unknown, form: FormData) {
  await requireAdmin();
  const text = String(form.get("reply") ?? "").trim();
  const message = await getMessage(id);
  if (!message) redirect("/admin");
  if (!text) return { error: "Write a reply first.", text };

  const email = replyEmail(message, text, site.url);
  const sent = await callScript<{ ok?: boolean }>({ action: "reply", to: message.email, ...email }).catch((err) => {
    console.error("[admin] reply failed:", err);
    return null;
  });
  if (!sent?.ok) return { error: "The reply couldn’t be sent. Please try again.", text };
  await addReply(id, text);
  redirect(`/admin/messages/${id}?notice=sent&t=${Date.now()}`); // t: a repeat reply pops up its notice again
}

/** Creates (id = null) or updates a client project. On a validation error it returns the
 *  submitted values, so the form can put them back. */
export async function saveProject(id: number | null, _state: unknown, form: FormData) {
  await requireAdmin();
  const project = parseProject(form);
  if ("error" in project) return { error: project.error, values: Object.fromEntries(form) as Record<string, string> };
  if (id) await updateProject(id, project);
  redirect(`/admin/projects/${id ?? (await createProject(project))}?saved=1`);
}

export async function removeProject(id: number) {
  await requireAdmin();
  await deleteProject(id);
  redirect("/admin/projects");
}
