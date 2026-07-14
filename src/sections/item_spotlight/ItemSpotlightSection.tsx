import { MenuItemCard } from "@/components/menu-item-card";
import { resolveItems } from "../helpers";
import type { SectionComponentProps } from "../types";
import type { ItemSpotlightSettings } from "./schema";

// A single highlighted item, larger than a grid card (PLAN.md §3 #8). Reuses the shared card
// (full-width, full description, configurable AR CTA label) so the AR flow stays in one place.
export function ItemSpotlightSection({
  settings,
  menuData,
}: SectionComponentProps<ItemSpotlightSettings>) {
  const [item] = resolveItems(menuData, { itemIds: [settings.itemId] });
  if (!item) return null;

  return (
    <div>
      {settings.heading ? (
        <h2
          className="mb-3 text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {settings.heading}
        </h2>
      ) : null}
      <MenuItemCard
        item={item}
        imagePosition="top"
        description="full"
        ctaLabel={settings.ctaLabel}
      />
    </div>
  );
}
