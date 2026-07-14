import { MenuItemCard } from "@/components/menu-item-card";
import { resolveItems } from "../helpers";
import type { SectionComponentProps } from "../types";
import type { BundleComparisonSettings } from "./schema";

// Side-by-side comparison of real menu_items (pizza sizes, combo boxes, flavor variants —
// PLAN.md §3 #6). "cards" reuses the shared item card; "table" is a compact price/description
// comparison. All styling via token CSS variables (Hard Rule #5).
export function BundleComparisonSection({
  settings,
  menuData,
}: SectionComponentProps<BundleComparisonSettings>) {
  const items = resolveItems(menuData, settings);
  if (items.length === 0) return null;

  const heading = settings.heading ? (
    <h2
      className="mb-3 text-lg font-semibold"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {settings.heading}
    </h2>
  ) : null;

  if (settings.layout === "table") {
    return (
      <div>
        {heading}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {items.map((item) => (
                  <th
                    key={item.id}
                    className="p-2 text-left font-semibold"
                    style={{
                      fontFamily: "var(--font-heading)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {items.map((item) => (
                  <td key={item.id} className="p-2 font-medium">
                    Rs {item.price.toFixed(0)}
                  </td>
                ))}
              </tr>
              <tr>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="p-2 align-top"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.description ?? ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const columns = Math.min(Math.max(items.length, 1), 4);
  return (
    <div>
      {heading}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: "calc(var(--spacing-unit) * 2)",
        }}
      >
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} description="short" />
        ))}
      </div>
    </div>
  );
}
