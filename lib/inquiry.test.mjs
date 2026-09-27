import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAddress } from "./email.ts";
import { inquiryEmail, parseInquiry } from "./inquiry.ts";

const form = (fields) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const valid = { name: "  Ada  Lovelace ", email: "ada@example.com", projectType: "Website", message: "Hi <b>there</b>" };

test("accepts a valid inquiry and normalises whitespace", () => {
  const i = parseInquiry(form(valid));
  assert.equal(i.name, "Ada Lovelace");
  assert.equal(i.budget, "");
});

test("rejects missing or invalid fields", () => {
  for (const bad of [
    { name: "" },
    { email: "not-an-email" },
    { email: "a b@example.com" },
    { projectType: "Spaceship" },
    { message: "   " },
    { message: "x".repeat(5001) },
    { budget: "₱1" },
    { timeline: "Yesterday" },
  ]) assert.ok("error" in parseInquiry(form({ ...valid, ...bad })), JSON.stringify(bad));
});

test("email escapes user input", () => {
  const { html, subject } = inquiryEmail(parseInquiry(form({ ...valid, name: "<script>x</script>\nBcc: x@example.com" })));
  assert.ok(!html.includes("<script>") && !html.includes("<b>there"));
  assert.ok(html.includes("&lt;b&gt;there&lt;/b&gt;"));
  assert.ok(!/[\r\n]/.test(subject));
});

test("sender addresses split into Brevo's name + email", () => {
  assert.deepEqual(parseAddress("ALVN <hello@alvn.test>"), { name: "ALVN", email: "hello@alvn.test" });
  assert.deepEqual(parseAddress('"ALVN — Built by Leou" <hello@alvn.test>'), { name: "ALVN — Built by Leou", email: "hello@alvn.test" });
  assert.deepEqual(parseAddress(" hello@alvn.test "), { email: "hello@alvn.test" });
});
