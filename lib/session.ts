// Admin sign-in primitives. Keep this file free of path aliases and Next.js imports so `npm test` can load it.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_DAYS = 30;

const hmac = (secret: string, value: string) => createHmac("sha256", secret).update(value).digest("base64url");

/** Session cookie value: "<expiry ms>.<HMAC of it>", signed with ADMIN_SECRET. */
export function createSession(secret: string, now = Date.now()) {
  const expires = now + SESSION_DAYS * 864e5;
  return `${expires}.${hmac(secret, `admin:${expires}`)}`;
}

export function verifySession(secret: string, value: string | undefined, now = Date.now()) {
  const [expires, mac = ""] = (value ?? "").split(".");
  if (!(Number(expires) > now)) return false;
  const expected = Buffer.from(hmac(secret, `admin:${expires}`));
  const given = Buffer.from(mac);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Passkey challenges: "<expiry ms>.<nonce>.<HMAC>", so handing one out needs no database row. */
export function createChallenge(secret: string, now = Date.now()) {
  const body = `${now + 15 * 60e3}.${randomBytes(16).toString("base64url")}`;
  return `${body}.${hmac(secret, `passkey:${body}`)}`;
}

/** A genuine, unexpired challenge's expiry (ms); 0 otherwise. */
export function verifyChallenge(secret: string, value: string, now = Date.now()) {
  const [expires, nonce, mac = ""] = value.split(".");
  if (!(Number(expires) > now) || !nonce) return 0;
  const expected = Buffer.from(hmac(secret, `passkey:${expires}.${nonce}`));
  const given = Buffer.from(mac);
  return given.length === expected.length && timingSafeEqual(given, expected) ? Number(expires) : 0;
}

/** One-time sign-in links: the email carries the token, the database keeps only its hash. */
export const newLoginToken = () => randomBytes(32).toString("base64url");
export const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
export const hashToken = sha256;
