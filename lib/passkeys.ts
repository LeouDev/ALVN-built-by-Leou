// Passkey (WebAuthn) checks for Face ID / Touch ID / fingerprint sign-in to the admin.
// Plain node:crypto, no path aliases or Next.js imports, so `npm test` can load it.
// Attestation is "none": a passkey is only ever added by an admin who is already signed in.
import { createHash, createPublicKey, verify } from "node:crypto";

/** COSE ids of the signature algorithms accepted, preferred first (ES256, Ed25519, RS256), and each one's key type. */
export const ALGORITHMS = [-7, -8, -257];
export const KEY_TYPES: Record<number, string> = { [-7]: "ec", [-8]: "ed25519", [-257]: "rsa" };

const sha256 = (data: Buffer) => createHash("sha256").update(data).digest();
const bytes = (base64url: string) => Buffer.from(base64url, "base64url");

/** What to call a passkey on this device: Face ID on iPhone and iPad, otherwise the general term. */
export const passkeyName = (userAgent: string) => (/iPhone|iPad/.test(userAgent) ? "Face ID" : "a passkey");

/** The site a passkey belongs to: the page's host without "www.", so it also works on the bare domain. */
export const rpIdFor = (origin: string) => new URL(origin).hostname.replace(/^www\./, "");

/**
 * What both ceremonies must prove: the browser ran this ceremony on this origin, and the authenticator signed
 * for this site with the person present and verified (Face ID, fingerprint or device passcode).
 * Returns the challenge it signed (the page's challenge token) and the authenticator's signature counter.
 */
export function checkCeremony(type: "webauthn.create" | "webauthn.get", origin: string, clientDataJSON: string, authenticatorData: string) {
  const client = JSON.parse(bytes(clientDataJSON).toString("utf8"));
  const auth = bytes(authenticatorData);
  if (client.type !== type || client.origin !== origin) throw new Error("Wrong ceremony or origin");
  if (auth.length < 37 || !auth.subarray(0, 32).equals(sha256(Buffer.from(rpIdFor(origin))))) throw new Error("Signed for another site");
  if ((auth[32] & 0b101) !== 0b101) throw new Error("Not verified"); // flag bits: 0 user present, 2 user verified
  return { challenge: bytes(String(client.challenge)).toString("utf8"), signCount: auth.readUInt32BE(33) };
}

/** The credential ID inside a new passkey's authenticator data (flag bit 6 says it's there). */
export function newCredentialId(authenticatorData: string) {
  const auth = bytes(authenticatorData);
  if (!(auth[32] & 0b1000000) || auth.length < 55) throw new Error("No credential");
  return auth.subarray(55, 55 + auth.readUInt16BE(53)).toString("base64url"); // after the 16-byte AAGUID and a 2-byte length
}

/** True when the stored public key signed authenticatorData + SHA-256(clientDataJSON). */
export function verifySignature(publicKey: string, algorithm: number, clientDataJSON: string, authenticatorData: string, signature: string) {
  const key = createPublicKey({ key: bytes(publicKey), format: "der", type: "spki" });
  const data = Buffer.concat([bytes(authenticatorData), sha256(bytes(clientDataJSON))]);
  // ES256 and RS256 hash with SHA-256 (WebAuthn's ECDSA signatures are DER, Node's default); Ed25519 takes no digest.
  return verify(algorithm === -8 ? null : "sha256", data, key, bytes(signature));
}

/** Counters only ever go up; Apple and Google passkeys always report 0, which is allowed. */
export const counterOk = (stored: number, next: number) => (stored === 0 && next === 0) || next > stored;
