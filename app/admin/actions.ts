"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, requireAdmin, startSession } from "@/lib/admin";
import { parseProject } from "@/lib/client-projects";
import { createProject, deleteProject, updateProject } from "@/lib/client-projects-db";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/inquiry";
import { addReply, getMessage, setArchived, unreadCount } from "@/lib/inbox";
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
