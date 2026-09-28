// Creates the admin tables from db/schema.sql. Safe to re-run.
//   node --env-file=.env.local scripts/db-setup.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("Admin tables are ready.");
await sql.end();
