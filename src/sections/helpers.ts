import type { MenuData, MenuItem } from "./types";

// Resolve a section's "content source" (PLAN.md §3): an explicit itemIds list wins over a
// categoryId, which wins over "all items". Sections receive the full menuData as a prop and
// filter here — they never fetch (Hard Rule #8 / create-section skill).
export function resolveItems(
  menuData: MenuData,
  source: { categoryId?: string; itemIds?: string[] }
): MenuItem[] {
  const { categoryId = "", itemIds = [] } = source;

  if (itemIds.length > 0) {
    const byId = new Map(menuData.items.map((i) => [i.id, i]));
    // Preserve the curated order the config author chose.
    return itemIds.map((id) => byId.get(id)).filter((i): i is MenuItem => Boolean(i));
  }

  const scoped = categoryId
    ? menuData.items.filter((i) => i.category_id === categoryId)
    : menuData.items;

  return [...scoped].sort((a, b) => a.sort_order - b.sort_order);
}

// Categories in display order, optionally filtered to an explicit subset (preserving the
// caller's chosen order when a subset is given).
export function resolveCategories(
  menuData: MenuData,
  categoryIds: string[] = []
) {
  if (categoryIds.length > 0) {
    const byId = new Map(menuData.categories.map((c) => [c.id, c]));
    return categoryIds
      .map((id) => byId.get(id))
      .filter((c): c is MenuData["categories"][number] => Boolean(c));
  }
  return [...menuData.categories].sort((a, b) => a.sort_order - b.sort_order);
}
