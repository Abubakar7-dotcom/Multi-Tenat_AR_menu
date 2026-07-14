import Link from "next/link";
import { createSupabaseSessionClient } from "@/lib/supabase/server-session";
import { createRestaurant } from "./actions";

export default async function StudioRestaurantListPage() {
  const supabase = await createSupabaseSessionClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, slug, name, is_active")
    .order("name", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Restaurants</h1>

      <ul className="mb-8 flex flex-col gap-2">
        {(restaurants ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/studio/${r.id}`}
              className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              <span className="font-medium">{r.name}</span>
              <span className="flex items-center gap-2 text-sm text-gray-500">
                /r/{r.slug}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.is_active ? "active" : "draft"}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {(restaurants ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No restaurants yet.</p>
        ) : null}
      </ul>

      <form action={createRestaurant} className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-sm font-semibold">New restaurant</h2>
        <div className="flex gap-3">
          <input
            name="name"
            placeholder="Name"
            required
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="slug (immutable)"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Create
          </button>
        </div>
      </form>
    </main>
  );
}
