"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/studio/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className="underline">
      Sign out
    </button>
  );
}
