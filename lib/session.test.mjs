import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, hashToken, newLoginToken, verifySession } from "./session.ts";

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
