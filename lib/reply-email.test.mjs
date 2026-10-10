import { test } from "node:test";
import assert from "node:assert/strict";
import { replyEmail } from "./reply-email.ts";

const inquiry = { kind: "inquiry", name: "Maya <Reyes>", body: "Hi!\nI need a website.", created_at: "2026-09-28T08:00:00Z" };

test("reply emails carry the text, signature, and quoted original in both formats", () => {
  const e = replyEmail(inquiry, "Thanks Maya!\n\nSee https://example.com/brief, then we talk.", "https://alvn.example");
  assert.equal(e.subject, "Re: Your project inquiry");
  assert.match(e.text, /^Thanks Maya!\n\nSee https:\/\/example\.com\/brief, then we talk\.\n\n— Leou\nbuild — Built by Leou · https:\/\/alvn\.example\n\nOn Sep 28, 2026, Maya <Reyes> wrote:\n> Hi!\n> I need a website\.$/);
  assert.match(e.html, /<p style="[^"]*">Thanks Maya!<\/p>/);
  assert.match(e.html, /<a href="https:\/\/example\.com\/brief"[^>]*>https:\/\/example\.com\/brief<\/a>, then we talk\./); // link, without the comma
  assert.match(e.html, /On Sep 28, 2026, Maya &lt;Reyes&gt; wrote/);
  assert.match(e.html, /Hi!<br>I need a website\./);
  assert.doesNotMatch(e.html, /<Reyes>/);
  assert.equal(replyEmail({ ...inquiry, kind: "booking" }, "Hi", "https://alvn.example").subject, "Re: Our 30-min intro call");
});

test("escapes anything the reply itself contains", () => {
  const e = replyEmail({ ...inquiry, body: "" }, `<img src=x onerror="alert(1)">`, "https://alvn.example");
  assert.doesNotMatch(e.html, /<img src=x/);
  assert.match(e.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(e.html, / wrote</); // no quote block without an original message
});
