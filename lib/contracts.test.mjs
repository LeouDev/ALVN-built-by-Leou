import { test } from "node:test";
import assert from "node:assert/strict";
import { blocks, contractBody, parseTerms, PAYMENT_PLANS, php, runs, split } from "./contracts.ts";
import { sha256 } from "./session.ts";

const provider = { name: "Leou Test", business: "TEST BOOKING SERVICES", businessNo: "123", address: "Mandaue City, Cebu, Philippines" };
const terms = {
  title: "Website Development Agreement",
  client_name: "Maya Reyes",
  client_email: "maya@example.com",
  client_company: "Maya's Bakery",
  scope: "- A 5-page website\n- Online ordering",
  price: 50000,
  plan: "50-50",
  custom_terms: "",
  start_date: "2026-10-01",
  due_date: "2026-10-31",
  revisions: 2,
  warranty_days: 30,
};

test("formats pesos the contract way and splits prices so the parts always add up", () => {
  assert.equal(php(50000), "PHP 50,000.00");
  assert.deepEqual(split(50000, [50, 50]), [25000, 25000]);
  assert.deepEqual(split(33333, [30, 40, 30]), [10000, 13333, 10000]);
  for (const price of [1, 999, 33333, 125000]) for (const pct of [[30, 40, 30], [40, 30, 30], [20, 26.67, 26.67, 26.66]]) assert.equal(split(price, pct).reduce((a, b) => a + b, 0), price);
});

test("every payment plan writes its terms with the right amounts", () => {
  const text = Object.fromEntries(PAYMENT_PLANS.map((p) => [p.id, p.text(50000)]));
  assert.match(text["50-50"], /50% \(PHP 25,000\.00\) is due on signing.*remaining 50% \(PHP 25,000\.00\)/);
  assert.match(text["30-40-30"], /PHP 15,000\.00.*PHP 20,000\.00.*PHP 15,000\.00/);
  assert.match(text["40-30-30"], /PHP 20,000\.00.*PHP 15,000\.00.*PHP 15,000\.00/);
  assert.match(text["100-upfront"], /full fee \(PHP 50,000\.00\)/);
  assert.match(text["20-installments"], /20% \(PHP 10,000\.00\).*balance of PHP 40,000\.00.*PHP 13,335\.00, PHP 13,335\.00, PHP 13,330\.00/);
  assert.match(text.retainer, /PHP 50,000\.00 per month/);
  assert.ok(PAYMENT_PLANS.length >= 7);
});

test("the agreement names both parties and carries the terms", () => {
  const body = contractBody(terms, provider, "2026-09-28");
  assert.match(body, /made on September 28, 2026/);
  assert.match(body, /\*\*Provider:\*\* Leou Test, doing business under the registered name TEST BOOKING SERVICES \(DTI Business Name No\. 123\)/);
  assert.match(body, /\*\*Client:\*\* Maya Reyes, representing Maya's Bakery, maya@example\.com/);
  assert.match(body, /Work starts on October 1, 2026 and is expected to be completed by October 31, 2026/);
  assert.match(body, /total fee for the project is PHP 50,000\.00\. 50% \(PHP 25,000\.00\)/);
  assert.match(body, /2 rounds of revisions/);
  assert.match(body, /For 30 days after launch/);
  assert.match(contractBody({ ...terms, plan: "retainer" }, provider, "2026-09-28"), /## 3\. Fees and payment\nThe fee is PHP 50,000\.00 per month/);
  assert.match(contractBody({ ...terms, plan: "custom", custom_terms: "Pay on Fridays." }, provider, "2026-09-28"), /PHP 50,000\.00\. Pay on Fridays\./);
});

test("the text parses into headings, paragraphs, and bullets", () => {
  const b = blocks("Intro line\n\n## 1. The project\nWe build:\n\n- One\n- Two\n\nClosing **bold** words");
  assert.deepEqual(b.map((x) => x.type), ["paragraph", "heading", "paragraph", "bullets", "paragraph"]);
  assert.deepEqual(b[3].lines, ["One", "Two"]);
  assert.deepEqual(runs("Closing **bold** words"), [{ bold: false, text: "Closing " }, { bold: true, text: "bold" }, { bold: false, text: " words" }]);
  assert.match(sha256("x"), /^[0-9a-f]{64}$/);
  assert.notEqual(sha256("x"), sha256("x "));
});

test("validates contract terms", () => {
  const form = (fields) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ ...terms, price: "50,000", revisions: "2", warranty_days: "30", ...fields })) f.set(k, String(v));
    return f;
  };
  assert.equal(parseTerms(form({})).price, 50000);
  for (const fields of [{ title: "" }, { client_email: "" }, { scope: "" }, { price: "0" }, { price: "abc" }, { plan: "later" }, { plan: "custom" }, { due_date: "2026-09-01" }, { revisions: "99" }])
    assert.ok("error" in parseTerms(form(fields)), JSON.stringify(fields));
});

test("a signature needs a name, a PNG, and consent", async () => {
  const { parseSignature } = await import("./contracts.ts");
  const png = "data:image/png;base64,iVBORw0KGgo=";
  const form = (fields) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ signer_name: " Maya  Reyes ", signature: png, consent: "on", ...fields })) if (v !== null) f.set(k, v);
    return f;
  };
  assert.deepEqual(parseSignature(form({})), { name: "Maya Reyes", image: png });
  for (const fields of [{ signer_name: "" }, { signature: "" }, { signature: "data:image/svg+xml;base64,PHN2Zz4=" }, { signature: "javascript:alert(1)" }, { consent: null }])
    assert.ok("error" in parseSignature(form(fields)), JSON.stringify(fields));
});
