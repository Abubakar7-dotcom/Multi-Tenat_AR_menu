import {
  createSupabaseSessionClient,
  getCurrentRestaurantStaff,
} from "@/lib/supabase/server-session";
import { ItemList } from "./item-list";
import { createItem } from "./actions";

export default async function DashboardItemsPage() {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) return null; // layout already redirects; satisfies TS narrowing

  const supabase = await createSupabaseSessionClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", staff.restaurantId)
      .order("sort_order", { ascending: true }),
    // Staff sees ALL items, including unavailable ones — the public menu is the one that
    // filters is_available=true (src/app/r/[slug]/page.tsx). Staff need to see and toggle them.
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, description, price, image_url, model_glb_url, model_usdz_url, badge_text, is_available, sort_order"
      )
      .eq("restaurant_id", staff.restaurantId)
      .order("sort_order", { ascending: true }),
  ]);

  const categoryList = categories ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Items</h1>

      {categoryList.length === 0 ? (
        <p className="mb-6 text-sm text-amber-600">
          Add a category first (Categories tab) before adding items.
        </p>
      ) : null}

      <ItemList items={items ?? []} categories={categoryList} />

      {categoryList.length > 0 ? (
        <form
          action={createItem}
          className="mt-6 flex flex-col gap-2 border-t pt-6"
        >
          <h2 className="text-sm font-semibold">New item</h2>
          <div className="flex gap-2">
            <input
              name="name"
              placeholder="Name"
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              name="category_id"
              required
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              required
              className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Add
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
