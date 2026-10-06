import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { checkCeremony, counterOk, newCredentialId, passkeyName, rpIdFor, verifySignature } from "./passkeys.ts";

const origin = "https://www.builtbyleou.info";
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sha256 = (buf) => createHash("sha256").update(buf).digest();

// Plays the authenticator: authenticator data (site hash, flags, counter, optional new credential) and client data.
function ceremony({ type = "webauthn.get", flags = 0b101, counter = 0, rpId = "builtbyleou.info", from = origin, credentialId } = {}) {
  const head = Buffer.alloc(37);
  sha256(Buffer.from(rpId)).copy(head);
  head[32] = flags | (credentialId ? 0b1000000 : 0);
  head.writeUInt32BE(counter, 33);
  const attested = credentialId ? Buffer.concat([Buffer.alloc(16), Buffer.from([0, credentialId.length]), credentialId, Buffer.from([0xa0])]) : Buffer.alloc(0);
  const clientData = Buffer.from(JSON.stringify({ type, challenge: b64u("challenge-123"), origin: from })); // browsers base64url the bytes
  return { auth: Buffer.concat([head, attested]), clientData };
}

const signed = (privateKey, digest, { auth, clientData }) => b64u(sign(digest, Buffer.concat([auth, sha256(clientData)]), privateKey));

test("the passkey's site is the host without www, and it's called Face ID on iPhone", () => {
  assert.equal(rpIdFor(origin), "builtbyleou.info");
  assert.equal(rpIdFor("http://localhost:3001"), "localhost");
  assert.equal(passkeyName("Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X)"), "Face ID");
  assert.equal(passkeyName("Mozilla/5.0 (Linux; Android 14; Pixel 8)"), "a passkey");
});

test("a sign-in signed with the stored key verifies (ES256 and Ed25519); tampering breaks it", () => {
  for (const [kind, options, alg, digest] of [["ec", { namedCurve: "P-256" }, -7, "sha256"], ["ed25519", {}, -8, null]]) {
    const { publicKey, privateKey } = generateKeyPairSync(kind, options);
    const spki = b64u(publicKey.export({ format: "der", type: "spki" }));
    const c = ceremony();
    const sig = signed(privateKey, digest, c);
    assert.ok(verifySignature(spki, alg, b64u(c.clientData), b64u(c.auth), sig), kind);
    const other = ceremony({ counter: 1 });
    assert.ok(!verifySignature(spki, alg, b64u(other.clientData), b64u(other.auth), sig), `${kind}: signature reused on other data`);
  }
});

test("the ceremony must be the right type, origin and site, with the person verified", () => {
  const ok = ceremony({ counter: 7 });
  assert.deepEqual(checkCeremony("webauthn.get", origin, b64u(ok.clientData), b64u(ok.auth)), { challenge: "challenge-123", signCount: 7 });
  const bad = [
    ["webauthn.create", ceremony()],
    ["webauthn.get", ceremony({ from: "https://evil.example" })],
    ["webauthn.get", ceremony({ rpId: "evil.example" })],
    ["webauthn.get", ceremony({ flags: 0b001 })], // present but not verified
  ];
  for (const [type, c] of bad) assert.throws(() => checkCeremony(type, origin, b64u(c.clientData), b64u(c.auth)));
});

test("a new passkey's credential ID is read from its authenticator data", () => {
  const id = Buffer.from("credential-xyz");
  assert.equal(newCredentialId(b64u(ceremony({ type: "webauthn.create", credentialId: id }).auth)), b64u(id));
  assert.throws(() => newCredentialId(b64u(ceremony().auth)));
});

test("signature counters may stay at 0 but otherwise must increase", () => {
  assert.ok(counterOk(0, 0));
  assert.ok(counterOk(0, 5));
  assert.ok(counterOk(5, 6));
  assert.ok(!counterOk(5, 5));
  assert.ok(!counterOk(5, 0));
});
