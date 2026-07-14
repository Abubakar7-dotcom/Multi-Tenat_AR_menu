import { createElement, type ReactNode } from "react";
import type { ZodType } from "zod";
import type { MenuData, SectionComponentProps } from "./types";

import { heroBannerSchema, HeroBannerSection } from "./hero_banner";
import { menuGridSchema, MenuGridSection } from "./menu_grid";
import { dealsCarouselSchema, DealsCarouselSection } from "./deals_carousel";
import { bannerSchema, BannerSection } from "./banner";
import {
  categoryShowcaseSchema,
  CategoryShowcaseSection,
} from "./category_showcase";
import {
  bundleComparisonSchema,
  BundleComparisonSection,
} from "./bundle_comparison";
import { heritageStorySchema, HeritageStorySection } from "./heritage_story";
import { itemSpotlightSchema, ItemSpotlightSection } from "./item_spotlight";
import { galleryGridSchema, GalleryGridSection } from "./gallery_grid";
import { storeLocatorSchema, StoreLocatorSection } from "./store_locator";
import { footerInfoSchema, FooterInfoSection } from "./footer_info";

// Pairs a section's settings schema (Layer 4) with its component. `defineSection` captures the
// per-section settings type T from both arguments, so the map is fully type-safe with no `any`
// or casts. `render` parses raw settings through the schema (filling defaults) before handing a
// validated object to the component — using createElement, not JSX, so this stays a .ts file
// per the documented path (CLAUDE.md folder map). safeParse + fallback means a single malformed
// section instance can never crash the whole page (Hard Rule #3: old configs must always parse).
function defineSection<T>(
  schema: ZodType<T>,
  component: (props: SectionComponentProps<T>) => ReactNode
) {
  return {
    schema,
    render(rawSettings: unknown, menuData: MenuData): ReactNode {
      const parsed = schema.safeParse(rawSettings ?? {});
      const settings = parsed.success ? parsed.data : schema.parse({});
      return createElement(component, { settings, menuData });
    },
  };
}

// THE registry. Keys are permanent registry keys written into stored restaurant configs — they
// are append-only forever (Hard Rule #3): add new sections, never rename or remove a key.
export const sectionRegistry = {
  hero_banner: defineSection(heroBannerSchema, HeroBannerSection),
  menu_grid: defineSection(menuGridSchema, MenuGridSection),
  deals_carousel: defineSection(dealsCarouselSchema, DealsCarouselSection),
  banner: defineSection(bannerSchema, BannerSection),
  category_showcase: defineSection(
    categoryShowcaseSchema,
    CategoryShowcaseSection
  ),
  bundle_comparison: defineSection(
    bundleComparisonSchema,
    BundleComparisonSection
  ),
  heritage_story: defineSection(heritageStorySchema, HeritageStorySection),
  item_spotlight: defineSection(itemSpotlightSchema, ItemSpotlightSection),
  gallery_grid: defineSection(galleryGridSchema, GalleryGridSection),
  store_locator: defineSection(storeLocatorSchema, StoreLocatorSection),
  footer_info: defineSection(footerInfoSchema, FooterInfoSection),
} as const;

export type SectionType = keyof typeof sectionRegistry;

export function isSectionType(type: string): type is SectionType {
  return type in sectionRegistry;
}
