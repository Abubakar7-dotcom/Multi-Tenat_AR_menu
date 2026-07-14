"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Draft → Publish (M2 mechanism). Copies draft_config into published_config and revalidates the
// public page so ISR serves the new config immediately (PLAN.md §7 M2, asset-pipeline SKILL
// step 6 pattern).
//
// SECURITY (Hard Rule #1): this uses the service-role client, which bypasses RLS. It is NOT yet
// wired to any route or UI. Before M3 exposes a Publish button, this action MUST verify the
// caller is an authenticated platform_admin (there is no session check here yet because there
// is no auth surface yet). Do not call this from any client-reachable path until that gate is
// added.
export async function publishRestaurant(restaurantId: string): Promise<void> {
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
