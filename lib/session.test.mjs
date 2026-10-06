import { test } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createSession, hashToken, newLoginToken, verifyChallenge, verifySession } from "./session.ts";

const secret = "a".repeat(64);

test("a session verifies until it expires, and only with the right secret", () => {
  const now = Date.parse("2026-09-28T00:00:00Z");
  const session = createSession(secret, now);
  assert.ok(verifySession(secret, session, now));
  assert.ok(verifySession(secret, session, now + 29 * 864e5));
  assert.ok(!verifySession(secret, session, now + 31 * 864e5));
  assert.ok(!verifySession("b".repeat(64), session, now));
});

test("tampered or malformed sessions are rejected", () => {
  const now = Date.now();
  const [expires, mac] = createSession(secret, now).split(".");
  for (const value of [undefined, "", "garbage", `${Number(expires) + 1}.${mac}`, `${expires}.${mac.slice(1)}`, `${expires}.`])
    assert.ok(!verifySession(secret, value, now), String(value));
});

test("login tokens are random and stored only as a hash", () => {
  const a = newLoginToken();
  assert.notEqual(a, newLoginToken());
  assert.ok(a.length >= 43);
  assert.match(hashToken(a), /^[0-9a-f]{64}$/);
  assert.equal(hashToken(a), hashToken(a));
});

test("a passkey challenge verifies for 15 minutes, and only untampered and with the right secret", () => {
  const now = Date.parse("2026-10-07T00:00:00Z");
  const challenge = createChallenge(secret, now);
  assert.equal(verifyChallenge(secret, challenge, now + 14 * 60e3), now + 15 * 60e3);
  assert.equal(verifyChallenge(secret, challenge, now + 16 * 60e3), 0);
  assert.equal(verifyChallenge("b".repeat(64), challenge, now), 0);
  const [expires, nonce, mac] = challenge.split(".");
  for (const value of ["", "garbage", `${Number(expires) + 1}.${nonce}.${mac}`, `${expires}.x${nonce}.${mac}`, `${expires}.${nonce}.`])
    assert.equal(verifyChallenge(secret, value, now), 0, value);
});
