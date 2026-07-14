import { ThemeProvider } from "./theme-provider";
import { LayoutShell } from "./layout-shell";
import { sectionRegistry, isSectionType } from "@/sections/registry";
import type { RestaurantConfig } from "@/lib/config/schema";
import type { MenuData } from "@/sections/types";

interface MenuRendererProps {
  config: RestaurantConfig;
  restaurant: { name: string; logo_url: string | null };
  menuData: MenuData;
}

// The composition engine's render loop — a dumb, uniform pass over the config's section list.
// Layer 1 (ThemeProvider → CSS vars) wraps Layer 2 (LayoutShell) wraps Layer 3 (the section
// instances), each Layer-4 settings object parsed + rendered by its registry entry. No section
// switch statement, no per-type branching here: adding a section means adding a registry key,
// nothing in this file changes (that's the whole point of the registry).
export function MenuRenderer({
  config,
  restaurant,
  menuData,
}: MenuRendererProps) {
  return (
    <ThemeProvider tokens={config.tokens}>
      <LayoutShell
        shell={config.layoutShell}
        restaurant={restaurant}
        categories={menuData.categories}
      >
        {config.sections.map((instance) => {
          // Unknown type (config from a newer deploy, or a removed section) → skip, don't crash.
          if (!isSectionType(instance.type)) return null;
          return (
            // id lets hero_banner CTAs (and any future in-page anchor) scroll to a section.
            <section key={instance.id} id={instance.id}>
              {sectionRegistry[instance.type].render(instance.settings, menuData)}
            </section>
          );
        })}
      </LayoutShell>
    </ThemeProvider>
  );
}
