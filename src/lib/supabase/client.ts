"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser-side Supabase client (anon key, RLS-enforced). Used only by client components that
// need to call auth methods directly (e.g. the login form's signInWithPassword). Never holds
// elevated privileges — same anon key as the public server client.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
