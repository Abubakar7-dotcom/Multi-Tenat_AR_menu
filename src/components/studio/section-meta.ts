import type { SectionType } from "@/sections/registry";

// Studio-only display metadata for each registry key — friendly label, one-line description,
// and an icon for the add-section library. Deliberately NOT part of the registry itself: the
// registry is the runtime contract (schema + component), this is editor chrome. Every key here
// must exist in sectionRegistry; a registry key missing here falls back to the raw key string.
export interface SectionMeta {
  label: string;
  description: string;
  icon: string;
}

export const sectionMeta: Record<SectionType, SectionMeta> = {
  hero_banner: {
    label: "Hero banner",
    description: "Big welcome visual with heading, subheading and a call-to-action",
    icon: "🖼️",
  },
  menu_grid: {
    label: "Menu grid",
    description: "The main catalog — items in a grid or list, grouped by category",
    icon: "🍽️",
  },
  deals_carousel: {
    label: "Deals carousel",
    description: "Horizontally scrolling strip of hand-picked featured items",
    icon: "🔥",
  },
  banner: {
    label: "Announcement bar",
    description: "Slim promotional message — offers, timings, announcements",
    icon: "📣",
  },
  category_showcase: {
    label: "Category showcase",
    description: "Tile grid of categories that jump to their spot in the menu",
    icon: "🗂️",
  },
  bundle_comparison: {
    label: "Bundle comparison",
    description: "Side-by-side deal bundles for easy comparison",
    icon: "⚖️",
  },
  heritage_story: {
    label: "Story block",
    description: "Brand story with image and rich text — heritage, values, craft",
    icon: "📜",
  },
  item_spotlight: {
    label: "Item spotlight",
    description: "One hero item, full width, with a big photo and AR button",
    icon: "⭐",
  },
  gallery_grid: {
    label: "Photo gallery",
    description: "Grid of ambience and food photography",
    icon: "📷",
  },
  store_locator: {
    label: "Store locator",
    description: "Branch list with addresses, phone numbers and hours",
    icon: "📍",
  },
  footer_info: {
    label: "Footer",
    description: "Contact info, social links and newsletter signup",
    icon: "ℹ️",
  },
};

export function sectionLabel(type: string): string {
  return (sectionMeta as Record<string, SectionMeta>)[type]?.label ?? type;
}
