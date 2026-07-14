import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Session-aware, cookie-backed Supabase client for Server Components / Server Actions / Route
// Handlers under an authenticated area (Studio, Merchant Dashboard). Still the anon key —
// RLS decides what an authenticated platform_admin or restaurant staff member can see, based
// on auth.uid() from the session cookie. This is deliberately NOT the service-role client.
export async function createSupabaseSessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component this throws (cookies are read-only there) — middleware is
          // what actually persists refreshed session cookies on the response. Safe to ignore.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // no-op, see comment above
          }
        },
      },
    }
  );
}

// Resolves the current session's user to a platform_admin row, or null if the visitor isn't
// signed in or isn't a platform admin. This is THE gate every /studio/* server-side check must
// use — never infer admin status from the mere presence of a session.
export async function getCurrentPlatformAdmin() {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return admin ? { id: user.id, email: user.email ?? null } : null;
}
