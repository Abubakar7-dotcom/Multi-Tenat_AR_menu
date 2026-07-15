import type { Database } from "@/lib/supabase/types";

// Menu data is passed to every section as a prop — sections never fetch it themselves
// (create-section skill rule + Hard Rule #8's one-renderer-no-drift guarantee). These types
// are subsets of the DB rows: only the columns the public page selects and sections actually
// read. Derived from the generated Database types so they can't silently drift from the schema.
type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type MenuCategory = Pick<CategoryRow, "id" | "name" | "sort_order">;

export type MenuItem = Pick<
  MenuItemRow,
  | "id"
  | "category_id"
  | "name"
  | "description"
  | "price"
  | "image_url"
  | "model_glb_url"
  | "model_usdz_url"
  | "badge_text"
  | "is_available"
  | "sort_order"
>;

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

// Every section component receives this exact prop shape, so the renderer loop stays a dumb
// uniform lookup. `settings` is typed per-section by the component itself (it parses its own
// schema type); here it's the already-validated settings object for that instance.
export interface SectionComponentProps<TSettings> {
  settings: TSettings;
  menuData: MenuData;
}
