import { notFound } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase/server-session";
import { StudioEditor } from "@/components/studio/studio-editor";
import { parseConfig } from "@/lib/config/schema";
import type { MenuData } from "@/sections/types";

interface EditorPageProps {
  params: Promise<{ restaurantId: string }>;
}

export default async function StudioEditorPage({ params }: EditorPageProps) {
  const { restaurantId } = await params;
  const supabase = await createSupabaseSessionClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, is_active, draft_config")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) notFound();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, description, price, image_url, model_glb_url, model_usdz_url, badge_text, is_available, sort_order"
      )
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
  ]);

  const menuData: MenuData = {
    categories: categories ?? [],
    items: items ?? [],
  };

  return (
    <StudioEditor
      restaurant={{
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        is_active: restaurant.is_active,
      }}
      initialConfig={parseConfig(restaurant.draft_config)}
      menuData={menuData}
    />
  );
}
