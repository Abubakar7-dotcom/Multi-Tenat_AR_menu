"use server";

import { revalidatePath } from "next/cache";
import {
  createSupabaseSessionClient,
  getCurrentRestaurantStaff,
} from "@/lib/supabase/server-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type MenuItemUpdate = Database["public"]["Tables"]["menu_items"]["Update"];

// restaurant_id is ALWAYS derived server-side from the session (never a client argument) —
// Hard Rule #1. See categories/actions.ts for the same pattern.
async function requireStaff() {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) throw new Error("Not authorized: restaurant staff session required.");
  return staff;
}

// Verifies categoryId actually belongs to this staff member's own restaurant. menu_items has
// no DB-level constraint tying category_id's restaurant_id to menu_items.restaurant_id, so
// without this check a staff member could attach an item to a category from a DIFFERENT
// restaurant (RLS's categories_own_staff_all only guards direct category writes, not this
// cross-table reference) — an app-level tenant-isolation gap, not just a UX nicety.
async function assertOwnCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseSessionClient>>,
  categoryId: string,
  restaurantId: string
) {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!data) throw new Error("Invalid category.");
}

// Uploads via the service-role client (Storage has no RLS policies configured on this bucket —
// see M1 notes; session client can read the public bucket but can't write to it). Gated by
// requireStaff() in every caller before this is ever invoked. Filename is timestamp-versioned
// and upsert:false — Hard Rule #4, never overwrite a file at the same URL.
async function uploadItemPhoto(
  restaurantId: string,
  itemId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Photo must be an image file.");
  }

  const admin = createSupabaseAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${restaurantId}/items/${itemId}-v${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage.from("menu-assets").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data } = admin.storage.from("menu-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function createItem(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) throw new Error("Item name is required.");
  if (!categoryId) throw new Error("Category is required.");
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number.");
  }
  await assertOwnCategory(supabase, categoryId, staff.restaurantId);

  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: staff.restaurantId,
    category_id: categoryId,
    name,
    description,
    price,
    is_available: true,
    sort_order: 0,
  });
  if (error) throw error;

  revalidatePath("/dashboard/items");
}

export async function updateItem(itemId: string, formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) throw new Error("Item name is required.");
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number.");
  }
  if (categoryId) {
    await assertOwnCategory(supabase, categoryId, staff.restaurantId);
  }

  const updates: MenuItemUpdate = { name, price, description };
  if (categoryId) updates.category_id = categoryId;

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    updates.image_url = await uploadItemPhoto(staff.restaurantId, itemId, photo);
  }

  const { error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", itemId)
    .eq("restaurant_id", staff.restaurantId);
  if (error) throw error;

  revalidatePath("/dashboard/items");
}

export async function toggleAvailability(
  itemId: string,
  isAvailable: boolean
): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId)
    .eq("restaurant_id", staff.restaurantId);
  if (error) throw error;

  revalidatePath("/dashboard/items");
}

export async function deleteItem(itemId: string): Promise<void> {
  const staff = await requireStaff();
  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("restaurant_id", staff.restaurantId);
  if (error) throw error;

  revalidatePath("/dashboard/items");
}
