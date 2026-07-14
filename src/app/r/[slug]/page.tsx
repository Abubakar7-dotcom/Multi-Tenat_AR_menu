import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseSessionClient,
  getCurrentPlatformAdmin,
} from "@/lib/supabase/server-session";
import { MenuRenderer } from "@/components/menu-renderer";
import { LivePreviewRoot } from "@/components/live-preview-root";
import { parseConfig, type RestaurantConfig } from "@/lib/config/schema";
import type { MenuData } from "@/sections/types";

export const revalidate = 3600; // ISR fallback; on-demand revalidatePath fires on Publish.

interface MenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
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

// M2: the page is driven entirely by DB config through the composition engine (Layers 1-4).
// This route is public and unauthenticated by default, serving only published_config via the
// anon (RLS-scoped) client — is_active=true is required, exactly as before.
//
// `?mode=preview` (Studio's live-preview iframe, M3) serves draft_config instead, requires a
// verified platform_admin session, and switches to the SESSION client so the
// platform_admin_all RLS policy grants access regardless of is_active — a brand-new,
// not-yet-published restaurant must still be previewable, which is the entire point of
// composing it in Studio before Publish. Unauthenticated preview requests get an identical 404
// to "restaurant doesn't exist" (never a distinguishable "forbidden"), so this route can't be
// used to probe which slugs exist or whether preview mode exists at all.
export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const isPreview = mode === "preview";

  if (isPreview) {
    const admin = await getCurrentPlatformAdmin();
    if (!admin) notFound();
  }

  const supabase = isPreview
    ? await createSupabaseSessionClient()
    : createSupabaseServerClient();

  let query = supabase
    .from("restaurants")
    .select("id, name, logo_url, draft_config, published_config, is_active")
    .eq("slug", slug);

  if (!isPreview) {
    query = query.eq("is_active", true);
  }

  const { data: restaurant } = await query.maybeSingle();

  if (!restaurant) {
    notFound();
  }

  const rawConfig = isPreview
    ? restaurant.draft_config
    : restaurant.published_config;
  const config = withFallbackSections(parseConfig(rawConfig));

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
  const restaurantInfo = { name: restaurant.name, logo_url: restaurant.logo_url };

  if (isPreview) {
    return (
      <LivePreviewRoot
        initialConfig={config}
        restaurant={restaurantInfo}
        menuData={menuData}
      />
    );
  }

  return (
    <MenuRenderer config={config} restaurant={restaurantInfo} menuData={menuData} />
  );
}
