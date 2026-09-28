import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProject, peso } from "./client-projects.ts";

const form = (fields) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ name: "Bakery website", client_name: "Maya Reyes", stage: "lead", ...fields })) f.set(k, v);
  return f;
};

test("accepts a project and normalises its fields", () => {
  assert.deepEqual(
    parseProject(
      form({
        name: "  Bakery   website ",
        client_email: "maya@example.com",
        budget: "₱50,000",
        paid: "",
        start_date: "2026-10-01",
        due_date: "2026-10-31",
        live_url: "https://maya.example.com",
        message_id: "12",
      }),
    ),
    {
      name: "Bakery website",
      client_name: "Maya Reyes",
      client_email: "maya@example.com",
      company: "",
      type: "",
      notes: "",
      stage: "lead",
      budget: 50000,
      paid: 0,
      start_date: "2026-10-01",
      due_date: "2026-10-31",
      live_url: "https://maya.example.com",
      repo_url: "",
      message_id: 12,
    },
  );
});

test("rejects projects with missing or invalid fields", () => {
  for (const fields of [
    { name: "" },
    { client_name: "" },
    { client_email: "not-an-email" },
    { stage: "shipped" },
    { budget: "fifty" },
    { paid: "-5" },
    { budget: "12.50" },
    { due_date: "31/10/2026" },
    { start_date: "2026-10-10", due_date: "2026-10-01" },
    { live_url: "javascript:alert(1)" },
    { repo_url: "github.com/x" },
    { notes: "x".repeat(10_001) },
  ])
    assert.ok("error" in parseProject(form(fields)), JSON.stringify(fields));
});

test("formats pesos", () => {
  assert.equal(peso(50000), "₱50,000");
  assert.equal(peso(0), "₱0");
});
