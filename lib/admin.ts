import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, SESSION_DAYS, verifySession } from "@/lib/session";

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
