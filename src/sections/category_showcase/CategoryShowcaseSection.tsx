import { resolveCategories } from "../helpers";
import type { SectionComponentProps } from "../types";
import type { CategoryShowcaseSettings } from "./schema";

// Icon+label tile grid over categories (PLAN.md §3 #5) — also what powers Tehzeeb's icon-grid
// nav pattern. Categories carry no icon asset in v1, so `showIcons` renders a token-styled
// initial badge as a stand-in. Columns drive an inline grid-template (never a runtime Tailwind
// class — Hard Rule #2).
export function CategoryShowcaseSection({
  settings,
  menuData,
}: SectionComponentProps<CategoryShowcaseSettings>) {
  const categories = resolveCategories(menuData, settings.categoryIds);
  if (categories.length === 0) return null;

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
        gap: "calc(var(--spacing-unit) * 2)",
      }}
    >
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex flex-col items-center gap-2 text-center"
          style={{
            padding: "calc(var(--spacing-unit) * 3)",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {settings.showIcons ? (
            <span
              className="flex h-10 w-10 items-center justify-center text-lg font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-contrast)",
                borderRadius: "var(--radius-button)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {category.name.charAt(0).toUpperCase()}
            </span>
          ) : null}
          <span className="text-sm font-medium">{category.name}</span>
        </div>
      ))}
    </div>
  );
}
