import type { ReactNode } from "react";
import type { LayoutShell } from "@/lib/config/schema";
import type { MenuCategory } from "@/sections/types";

// Anchor id a menu_grid category group uses, so the shell's category nav can jump to it.
// Shared convention between this shell and MenuGridSection.
export function categoryAnchorId(categoryId: string): string {
  return `cat-${categoryId}`;
}

const sectionSpacingUnits: Record<LayoutShell["sectionSpacing"], number> = {
  tight: 3,
  normal: 5,
  relaxed: 8,
};

interface LayoutShellProps {
  shell: LayoutShell;
  restaurant: { name: string; logo_url: string | null };
  categories: MenuCategory[];
  children: ReactNode;
}

function Logo({ restaurant }: { restaurant: LayoutShellProps["restaurant"] }) {
  return (
    <div className="flex items-center gap-2">
      {restaurant.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env.
        <img
          src={restaurant.logo_url}
          alt={restaurant.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : null}
      <span
        className="text-lg font-bold"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {restaurant.name}
      </span>
    </div>
  );
}

// Category nav (Layer 2). Links are plain anchors to each category group's id — no client JS.
// `sidebar-drawer` renders as a horizontally-scrolling chip row for M2 (a true off-canvas
// drawer is a later client enhancement; the setting persists so configs stay valid).
function CategoryNav({
  style,
  categories,
}: {
  style: LayoutShell["categoryNavStyle"];
  categories: MenuCategory[];
}) {
  if (categories.length === 0) return null;

  if (style === "icon-grid") {
    return (
      <nav
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))`,
          gap: "calc(var(--spacing-unit) * 2)",
        }}
      >
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${categoryAnchorId(c.id)}`}
            className="flex flex-col items-center gap-1 text-center text-xs font-medium"
            style={{
              padding: "calc(var(--spacing-unit) * 2)",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-card)",
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-contrast)",
                borderRadius: "var(--radius-button)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
            {c.name}
          </a>
        ))}
      </nav>
    );
  }

  const isTabs = style === "tabs";
  return (
    <nav
      className="flex overflow-x-auto pb-1"
      style={{ gap: "calc(var(--spacing-unit) * 2)" }}
    >
      {categories.map((c) => (
        <a
          key={c.id}
          href={`#${categoryAnchorId(c.id)}`}
          className="whitespace-nowrap px-3 py-1.5 text-sm font-medium"
          style={
            isTabs
              ? {
                  borderBottom: "2px solid var(--color-primary)",
                  color: "var(--color-text)",
                }
              : {
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  borderRadius: "var(--radius-button)",
                }
          }
        >
          {c.name}
        </a>
      ))}
    </nav>
  );
}

// Layer 2 renderer: header + category nav + the max-width, vertically-spaced section stack.
export function LayoutShell({
  shell,
  restaurant,
  categories,
  children,
}: LayoutShellProps) {
  const nav = <CategoryNav style={shell.categoryNavStyle} categories={categories} />;
  const gap = `calc(var(--spacing-unit) * ${sectionSpacingUnits[shell.sectionSpacing]})`;

  let header: ReactNode;
  if (shell.headerStyle === "centered-logo") {
    header = (
      <header className="flex flex-col items-center gap-3 py-6 text-center">
        <Logo restaurant={restaurant} />
        {nav}
      </header>
    );
  } else if (shell.headerStyle === "sticky-bar") {
    header = (
      <header
        className="sticky top-0 z-40 flex flex-col gap-2 py-3"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Logo restaurant={restaurant} />
        {nav}
      </header>
    );
  } else {
    // logo-plus-menu
    header = (
      <header className="flex flex-col gap-3 py-4">
        <Logo restaurant={restaurant} />
        {nav}
      </header>
    );
  }

  return (
    <main
      className="mx-auto w-full px-4 pb-16"
      style={{ maxWidth: `${shell.pageMaxWidth}px` }}
    >
      {header}
      <div className="flex flex-col" style={{ gap }}>
        {children}
      </div>
    </main>
  );
}
