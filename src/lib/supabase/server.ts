import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-only, anon-key client for public read paths (e.g. /r/[slug]). RLS enforces tenant
// isolation and the is_active/is_available scoping — this client is never given elevated
// privileges, so a bug here fails closed rather than leaking cross-tenant data.
//
// Note: this talks to Supabase's PostgREST HTTP API, not a direct Postgres connection, so the
// pooled-connection (pgBouncer, port 6543) rule doesn't apply here — that rule governs
// DATABASE_URL, used by CLI/migration tooling and any future direct-Postgres driver, not this
// client. See .claude/skills/db-migration/SKILL.md.
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example."
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
}
