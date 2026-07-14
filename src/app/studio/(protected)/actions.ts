"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseSessionClient } from "@/lib/supabase/server-session";
import { getCurrentPlatformAdmin } from "@/lib/supabase/server-session";
import { configSchema, type RestaurantConfig } from "@/lib/config/schema";

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Creates a new restaurant. Uses the SESSION client (not the service-role admin client) —
// RLS's restaurants_platform_admin_all policy is the actual authorization boundary here; the
// explicit admin check below is for a clean error message, not a substitute for RLS (defense
// in depth still holds even if this check were ever removed by mistake).
export async function createRestaurant(formData: FormData): Promise<void> {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) throw new Error("Not authorized: platform admin session required.");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  if (!name) throw new Error("Restaurant name is required.");
  if (!slugPattern.test(slug)) {
    throw new Error(
      "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-restaurant)."
    );
  }

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase.from("restaurants").insert({
    name,
    slug,
    is_active: false,
    draft_config: {},
    published_config: {},
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Slug "${slug}" is already taken — slugs are immutable, pick another.`);
    }
    throw error;
  }

  revalidatePath("/studio");
}

// Persists the Studio editor's in-progress config to draft_config only — never touches
// published_config (that's exclusively publishRestaurant()'s job, so "Save" and "Publish"
// stay two distinct, deliberate actions and a saved draft can never accidentally go live).
export async function saveDraft(
  restaurantId: string,
  config: RestaurantConfig
): Promise<void> {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) throw new Error("Not authorized: platform admin session required.");

  // Re-validate server-side — never trust a client-serialized config object as-is, even from
  // an authorized caller (guards against a stale/corrupt client state being persisted).
  const validated = configSchema.parse(config);

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ draft_config: validated })
    .eq("id", restaurantId);

  if (error) throw error;
}
