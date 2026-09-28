import postgres from "postgres";

// Supabase Postgres, reached through its transaction pooler (DATABASE_URL). The admin tables live in
// their own `alvn` schema, which Supabase's public API doesn't expose: see scripts/db-setup.mjs.
// Connects on first query, so builds don't need DATABASE_URL.
let client: postgres.Sql | undefined;

export function sql<T extends readonly object[] = postgres.Row[]>(
  strings: TemplateStringsArray,
  ...values: postgres.ParameterOrFragment<never>[]
) {
  // The transaction pooler can't keep prepared statements between requests.
  client ??= postgres(process.env.DATABASE_URL!, { prepare: false, idle_timeout: 20 });
  return client<T>(strings, ...values);
}
