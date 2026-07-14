import { MenuItemCard } from "@/components/menu-item-card";
import { resolveItems } from "../helpers";
import type { SectionComponentProps } from "../types";
import type { DealsCarouselSettings } from "./schema";

// Horizontal, scroll-snapping strip of curated item cards. `autoScroll` is honored as
// scroll-snap behavior for M2; a timed auto-advance is a later client-side enhancement (the
// setting already exists so configs are forward-compatible — Hard Rule #3).
export function DealsCarouselSection({
  settings,
  menuData,
}: SectionComponentProps<DealsCarouselSettings>) {
  const items = resolveItems(menuData, { itemIds: settings.itemIds });
  if (items.length === 0) return null;

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
      <div
        className="flex snap-x snap-mandatory overflow-x-auto pb-2"
        style={{ gap: "calc(var(--spacing-unit) * 2)" }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-40 shrink-0 snap-start">
            <MenuItemCard item={item} description="none" />
          </div>
        ))}
      </div>
    </div>
  );
}
