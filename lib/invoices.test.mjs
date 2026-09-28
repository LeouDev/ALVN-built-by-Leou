import { test } from "node:test";
import assert from "node:assert/strict";
import { invoiceEmail, invoiceNumber, invoiceTotal, parseInvoice } from "./invoices.ts";

const form = (fields, items = [["Website: 50% on signing", "25,000"], ["", ""]]) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ client_name: "Maya Reyes", client_email: "maya@example.com", issue_date: "2026-10-01", due_date: "2026-10-08", notes: "GCash 0917 000 0000", ...fields })) f.set(k, v);
  for (const [d, a] of items) (f.append("item_description", d), f.append("item_amount", a));
  return f;
};

test("numbers and totals", () => {
  assert.equal(invoiceNumber(1), "ALVN-0001");
  assert.equal(invoiceNumber(123), "ALVN-0123");
  assert.equal(invoiceTotal([{ description: "a", amount: 25000 }, { description: "b", amount: 1500 }]), 26500);
});

test("parses line items, skipping blank rows", () => {
  const inv = parseInvoice(form({}, [["Website: 50% on signing", "₱25,000"], ["", ""], ["Domain, first year", "1500"]]));
  assert.deepEqual(inv.items, [{ description: "Website: 50% on signing", amount: 25000 }, { description: "Domain, first year", amount: 1500 }]);
});

test("rejects invoices with missing or invalid fields", () => {
  for (const [fields, items] of [
    [{ client_email: "nope" }, undefined],
    [{}, [["", ""]]],
    [{}, [["Website", ""]]],
    [{}, [["", "5000"]]],
    [{}, [["Website", "12.50"]]],
    [{ due_date: "2026-09-01" }, undefined],
    [{ issue_date: "" }, undefined],
  ])
    assert.ok("error" in parseInvoice(form(fields, items)), JSON.stringify([fields, items]));
});

test("the email summarises the invoice and escapes client-provided text", () => {
  const inv = { client_name: "Maya <b>Reyes</b>", client_email: "m@x.co", client_company: "", issue_date: "2026-10-01", due_date: "2026-10-08", notes: "GCash\n0917 000 0000", number: "ALVN-0001", total: 26500, items: [{ description: "Website <50%>", amount: 25000 }, { description: "Domain", amount: 1500 }] };
  const e = invoiceEmail(inv, "https://alvn.example");
  assert.equal(e.subject, "Invoice ALVN-0001: PHP 26,500.00 due October 8, 2026");
  assert.match(e.text, /- Website <50%>: PHP 25,000\.00\n- Domain: PHP 1,500\.00\nTotal due: PHP 26,500\.00\n\nHow to pay:\nGCash\n0917 000 0000/);
  assert.match(e.html, /Website &lt;50%&gt;/);
  assert.match(e.html, /GCash<br>0917 000 0000/);
  assert.doesNotMatch(e.html, /<b>Reyes/);
  assert.match(invoiceEmail(inv, "https://alvn.example", true).subject, /^Reminder: Invoice ALVN-0001/);
});
