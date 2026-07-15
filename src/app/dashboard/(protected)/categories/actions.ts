"use server";

import { revalidatePath } from "next/cache";
import {
  createSupabaseSessionClient,
  getCurrentRestaurantStaff,
} from "@/lib/supabase/server-session";

// restaurant_id is ALWAYS derived server-side from the session (never accepted as a client
// argument) — Hard Rule #1: never trust a client-supplied restaurant_id. RLS's
// categories_own_staff_all policy would block a mismatch anyway, but deriving it here means
// there is never a client-suppliable value to mismatch in the first place.
async function requireStaff() {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) throw new Error("Not authorized: restaurant staff session required.");
  return staff;
}

export async function createCategory(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");

  const supabase = await createSupabaseSessionClient();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", staff.restaurantId);

  const { error } = await supabase.from("categories").insert({
    restaurant_id: staff.restaurantId,
    name,
    sort_order: count ?? 0,
  });
  if (error) throw error;

  revalidatePath("/dashboard/categories");
}

export async function renameCategory(categoryId: string, name: string): Promise<void> {
  const staff = await requireStaff();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required.");

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: trimmed })
    .eq("id", categoryId)
    .eq("restaurant_id", staff.restaurantId);
  if (error) throw error;

  revalidatePath("/dashboard/categories");
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", staff.restaurantId);
  if (error) throw error;

  revalidatePath("/dashboard/categories");
}

// Persists a full new ordering (array of category ids in display order) after a drag reorder.
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("categories")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("restaurant_id", staff.restaurantId)
    )
  );

  revalidatePath("/dashboard/categories");
}
