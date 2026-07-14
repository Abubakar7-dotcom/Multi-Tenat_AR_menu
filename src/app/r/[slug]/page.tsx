import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MenuRenderer } from "@/components/menu-renderer";
import { parseConfig, type RestaurantConfig } from "@/lib/config/schema";
import type { MenuData } from "@/sections/types";

export const revalidate = 3600; // ISR fallback; on-demand revalidatePath fires on Publish.

interface MenuPageProps {
  params: Promise<{ slug: string }>;
}

// If a config has no sections yet (brand-new / un-composed restaurant), fall back to a single
// default menu_grid so an active restaurant is never a blank page. Studio (M3) replaces this by
// seeding a real preset config; this is just a safety net, not a substitute for composition.
function withFallbackSections(config: RestaurantConfig): RestaurantConfig {
  if (config.sections.length > 0) return config;
  return {
    ...config,
    sections: [{ id: "default-menu", type: "menu_grid", settings: {} }],
  };
}

// M2: the page is now driven entirely by DB config through the composition engine (Layers 1-4).
// The hardcoded M1 rendering is gone — this same renderer draws every restaurant.
//
// This route is PUBLIC and unauthenticated, so it only ever serves published_config. Draft
// preview (Studio's live iframe, `?mode=preview` → draft_config) is deliberately NOT here yet:
// serving unpublished drafts to anonymous visitors is unintended disclosure. M3 reintroduces
// preview behind a platform_admin session check, once that auth surface exists.
export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params;

  const supabase = createSupabaseServerClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, logo_url, published_config, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!restaurant) {
    notFound();
  }

  const config = withFallbackSections(parseConfig(restaurant.published_config));

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, description, price, image_url, model_glb_url, model_usdz_url, badge_text, sort_order"
      )
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  const menuData: MenuData = {
    categories: categories ?? [],
    items: items ?? [],
  };

  return (
    <MenuRenderer
      config={config}
      restaurant={{ name: restaurant.name, logo_url: restaurant.logo_url }}
      menuData={menuData}
    />
  );
}
