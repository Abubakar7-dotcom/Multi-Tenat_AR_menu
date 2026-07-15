import { createSupabaseSessionClient, getCurrentRestaurantStaff } from "@/lib/supabase/server-session";
import { CategoryList } from "./category-list";
import { createCategory } from "./actions";

export default async function DashboardCategoriesPage() {
  const staff = await getCurrentRestaurantStaff();
  if (!staff) return null; // layout already redirects; satisfies TS narrowing

  const supabase = await createSupabaseSessionClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .eq("restaurant_id", staff.restaurantId)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Categories</h1>

      <CategoryList categories={categories ?? []} />

      <form action={createCategory} className="mt-6 flex gap-2 border-t pt-6">
        <input
          name="name"
          placeholder="New category name"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </form>
    </main>
  );
}
