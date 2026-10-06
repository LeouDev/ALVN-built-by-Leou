import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { rpIdFor } from "@/lib/passkeys";
import { createChallenge, createSession, SESSION_DAYS, verifyChallenge, verifySession } from "@/lib/session";

export const SESSION_COOKIE = "alvn_admin";

function secret() {
  const value = process.env.ADMIN_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SECRET must be set to 32+ random characters");
  return value;
}

export async function isAdmin() {
  return verifySession(secret(), (await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and server action: layouts alone don't guard them. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** A signed passkey challenge, and the check for one coming back (its expiry, or 0). */
export const passkeyChallenge = () => createChallenge(secret());
export const checkPasskeyChallenge = (value: string) => verifyChallenge(secret(), value);

/** This site's passkey ID, for pages (server actions read it from the Origin header instead). */
export const siteRpId = async () => rpIdFor(`http://${(await headers()).get("host")}`);

/** Whether a passkey has been saved; false while the passkeys table doesn't exist yet. */
export const hasPasskeys = () => sql`select 1 from alvn.passkeys limit 1`.then((rows) => rows.length > 0, () => false);

/** Set when "Not now" is chosen on the inbox's passkey offer. */
export const PASSKEY_PROMPT_COOKIE = "alvn_passkey_prompt";

export async function startSession() {
  (await cookies()).set(SESSION_COOKIE, createSession(secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** Dates in the admin are shown in Manila time, whatever time zone the server runs in. */
export const inManila = (date: Date | string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", ...options }).format(new Date(date));

/** Today's date in Manila as "YYYY-MM-DD", to compare with date columns. */
export const todayInManila = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());

/** The visitor's IP and browser, recorded with each signature. */
export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return { ip, ua: (h.get("user-agent") ?? "").slice(0, 300) };
}
