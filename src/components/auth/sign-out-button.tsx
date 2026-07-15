"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
  redirectTo: string;
}

export function SignOutButton({ redirectTo }: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className="underline">
      Sign out
    </button>
  );
}
