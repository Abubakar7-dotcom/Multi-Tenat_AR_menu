import { configSchema, type RestaurantConfig } from "@/lib/config/schema";

// Starter presets seeded from the brand coverage matrix (PLAN.md §3) — a new restaurant in
// Studio starts from the closest-matching mood and gets tweaked, rather than starting blank.
// itemIds/categoryIds are intentionally empty here (they're restaurant-specific); presets set
// the token/shell/section-shape mood, not curated content.
export interface Preset {
  key: string;
  label: string;
  config: RestaurantConfig;
}

export const presets: Preset[] = [
  {
    key: "loud-fastfood",
    label: "Loud Fast Food (Cheezious-like)",
    config: {
      tokens: {
        colorPrimary: "#E4002B",
        colorPrimaryContrast: "#FFFFFF",
        colorAccent: "#FFC72C",
        colorAccentContrast: "#1A1A1A",
        colorBackground: "#FFFFFF",
        colorSurface: "#FFF8E1",
        colorText: "#1A1A1A",
        colorTextMuted: "#6B6B6B",
        fontHeading: "Baloo 2",
        fontBody: "Inter",
        cornerRadius: "soft",
        buttonShape: "pill",
        spacingDensity: "compact",
        cardShadow: "soft",
        backgroundTextureUrl: "",
      },
      layoutShell: {
        headerStyle: "logo-plus-menu",
        categoryNavStyle: "pills",
        pageMaxWidth: 640,
        sectionSpacing: "normal",
      },
      sections: [
        { id: "sec-deals", type: "deals_carousel", settings: { heading: "Today's Deals" } },
        { id: "sec-showcase", type: "category_showcase", settings: {} },
        { id: "sec-menu", type: "menu_grid", settings: {} },
        { id: "sec-footer", type: "footer_info", settings: {} },
      ],
    },
  },
  {
    key: "heritage-bakery",
    label: "Heritage Bakery (Tehzeeb-like)",
    config: {
      tokens: {
        colorPrimary: "#6B3F2A",
        colorPrimaryContrast: "#FFFFFF",
        colorAccent: "#9C9186",
        colorAccentContrast: "#FFFFFF",
        colorBackground: "#FFFFFF",
        colorSurface: "#FAFAFA",
        colorText: "#2A2A2A",
        colorTextMuted: "#6B6B6B",
        fontHeading: "Poppins",
        fontBody: "Work Sans",
        cornerRadius: "soft",
        buttonShape: "rounded",
        spacingDensity: "spacious",
        cardShadow: "soft",
        backgroundTextureUrl: "",
      },
      layoutShell: {
        headerStyle: "logo-plus-menu",
        categoryNavStyle: "icon-grid",
        pageMaxWidth: 640,
        sectionSpacing: "relaxed",
      },
      sections: [
        { id: "sec-hero", type: "hero_banner", settings: {} },
        { id: "sec-showcase", type: "category_showcase", settings: { columns: 4 } },
        { id: "sec-menu", type: "menu_grid", settings: { showDescription: "full" } },
        { id: "sec-heritage", type: "heritage_story", settings: {} },
        { id: "sec-footer", type: "footer_info", settings: { showNewsletter: true } },
      ],
    },
  },
  {
    key: "blank",
    label: "Blank (defaults only)",
    config: configSchema.parse({}),
  },
];
