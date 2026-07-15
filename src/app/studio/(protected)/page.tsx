import Link from "next/link";
import { createSupabaseSessionClient } from "@/lib/supabase/server-session";
import { createRestaurant } from "./actions";

export default async function StudioRestaurantListPage() {
  const supabase = await createSupabaseSessionClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, slug, name, is_active, published_config")
    .order("name", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Restaurants</h1>
        <span className="text-sm text-gray-500">
          {(restaurants ?? []).length} total
        </span>
      </div>

      <ul className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(restaurants ?? []).map((r) => {
          // Peek at the published theme's colors for the card accent strip — read-only, and
          // tolerant of missing/malformed config (brand-new restaurants have none).
          const tokens =
            (r.published_config as { tokens?: Record<string, string> } | null)?.tokens ?? {};
          const swatches = [
            tokens.colorPrimary ?? "#111111",
            tokens.colorAccent ?? "#666666",
            tokens.colorSurface ?? "#F5F5F5",
          ];
          return (
            <li key={r.id} className="rounded-lg border border-gray-200 bg-white">
              <Link href={`/studio/${r.id}`} className="block p-4 hover:bg-gray-50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.is_active ? "live" : "draft"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">/r/{r.slug}</span>
                  <span className="flex gap-1">
                    {swatches.map((color, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                </div>
              </Link>
              <div className="flex divide-x divide-gray-100 border-t border-gray-100 text-xs">
                <Link
                  href={`/studio/${r.id}`}
                  className="flex-1 px-3 py-2 text-center font-medium text-gray-600 hover:bg-gray-50"
                >
                  Compose
                </Link>
                <Link
                  href={`/studio/${r.id}/qr`}
                  className="flex-1 px-3 py-2 text-center font-medium text-gray-600 hover:bg-gray-50"
                >
                  QR code
                </Link>
                <a
                  href={`/r/${r.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-3 py-2 text-center font-medium text-gray-600 hover:bg-gray-50"
                >
                  Live menu ↗
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {(restaurants ?? []).length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">No restaurants yet — create the first one below.</p>
      ) : null}

      <form action={createRestaurant} className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-sm font-semibold">New restaurant</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
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
