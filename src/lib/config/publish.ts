"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlatformAdmin } from "@/lib/supabase/server-session";

// Draft → Publish (M2 mechanism, M3 auth-gated). Copies draft_config into published_config and
// revalidates the public page so ISR serves the new config immediately (PLAN.md §7 M2,
// asset-pipeline SKILL step 6 pattern).
//
// SECURITY (Hard Rule #1): this uses the service-role client, which bypasses RLS entirely, so
// this explicit check is the ONLY thing standing between "any caller" and "publish anything."
// Verified against the M2 tenant-security-reviewer finding — this must run before any DB
// access, not after.
export async function publishRestaurant(restaurantId: string): Promise<void> {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) {
    throw new Error("Not authorized: platform admin session required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data: restaurant, error: readError } = await supabase
    .from("restaurants")
    .select("slug, draft_config")
    .eq("id", restaurantId)
    .maybeSingle();

  if (readError) throw readError;
  if (!restaurant) throw new Error(`Restaurant not found: ${restaurantId}`);

  const { error: writeError } = await supabase
    .from("restaurants")
    .update({ published_config: restaurant.draft_config })
    .eq("id", restaurantId);

  if (writeError) throw writeError;

  revalidatePath(`/r/${restaurant.slug}`);
}
