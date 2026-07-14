import { MenuItemCard } from "@/components/menu-item-card";
import { categoryAnchorId } from "@/components/layout-shell";
import { resolveCategories, resolveItems } from "../helpers";
import type { SectionComponentProps } from "../types";
import type { MenuGridSettings } from "./schema";

// The core catalog section. With an explicit content source (itemIds or categoryId) it renders
// a single flat grid; with neither it groups ALL items under their category headings — which is
// how it reproduces the M1 hardcoded page from config (M2 acceptance criterion).
export function MenuGridSection({
  settings,
  menuData,
}: SectionComponentProps<MenuGridSettings>) {
  const isList = settings.layout === "list";
  const columns = isList ? 1 : settings.columns;
  const imagePosition = isList ? "left" : settings.cardImagePosition;

  const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const gap = { gap: "calc(var(--spacing-unit) * 2)" };

  // Explicit source → one flat grid.
  if (settings.itemIds.length > 0 || settings.categoryId) {
    const items = resolveItems(menuData, settings);
    if (items.length === 0) return null;
    return (
      <div className="grid" style={{ ...gridStyle, ...gap }}>
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            imagePosition={imagePosition}
            description={settings.showDescription}
            showBadge={settings.showBadge}
          />
        ))}
      </div>
    );
  }

  // No explicit source → group every category with a heading.
  const categories = resolveCategories(menuData);
  const groups = categories
    .map((category) => ({
      category,
      items: resolveItems(menuData, { categoryId: category.id }),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col" style={{ gap: "calc(var(--spacing-unit) * 5)" }}>
      {groups.map(({ category, items }) => (
        <div key={category.id} id={categoryAnchorId(category.id)}>
          <h2
            className="mb-3 text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {category.name}
          </h2>
          <div className="grid" style={{ ...gridStyle, ...gap }}>
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                imagePosition={imagePosition}
                description={settings.showDescription}
                showBadge={settings.showBadge}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
