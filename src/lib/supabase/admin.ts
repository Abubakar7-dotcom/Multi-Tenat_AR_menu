import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role Supabase client — BYPASSES RLS. The `server-only` import makes any attempt to
// pull this into a client bundle a build error, so the service-role key can never reach the
// browser. Every caller MUST independently verify the request is authorized for the specific
// restaurant_id it touches BEFORE using this client (there is no RLS backstop here). See the
// tenant-security-reviewer checklist.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See .env.example."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
