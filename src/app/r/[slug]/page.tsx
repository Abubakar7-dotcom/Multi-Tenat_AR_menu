import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MenuItemCard } from "@/components/menu-item-card";

export const revalidate = 3600; // ISR fallback; on-demand revalidatePath lands in M2 with Publish.

interface MenuPageProps {
  params: Promise<{ slug: string }>;
}

// M1: a hardcoded rendering (not the composition engine yet) proving the real data path and
// AR flow end-to-end for one restaurant. Layer 1-4 composition (tokens, layout shell,
// section registry) is M2.
export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params;
  const supabase = createSupabaseServerClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, logo_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!restaurant) {
    notFound();
  }

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, description, price, image_url, model_glb_url, model_usdz_url, is_available, sort_order"
      )
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <main className="mx-auto max-w-xl px-4 pb-16">
      <header className="flex flex-col items-center gap-2 py-8 text-center">
        {restaurant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 domain is dynamic per env.
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : null}
        <h1 className="text-xl font-bold">{restaurant.name}</h1>
      </header>

      {(categories ?? []).map((category) => {
        const categoryItems = (items ?? []).filter(
          (item) => item.category_id === category.id
        );
        if (categoryItems.length === 0) return null;

        return (
          <section key={category.id} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{category.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {categoryItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.image_url}
                  modelGlbUrl={item.model_glb_url}
                  modelUsdzUrl={item.model_usdz_url}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
