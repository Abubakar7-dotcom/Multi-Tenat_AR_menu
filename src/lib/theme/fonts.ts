// Curated Google Fonts list for Studio's font pickers (PLAN.md §4a). The token itself stays a
// free string in the schema — old configs with any family keep parsing (Hard Rule #3) — this
// list only drives the Studio dropdown. Grouped loosely by personality so an admin composing a
// brand can pick fast.
export interface CuratedFont {
  family: string;
  vibe: string;
}

export const curatedFonts: CuratedFont[] = [
  { family: "Inter", vibe: "Neutral, modern default" },
  { family: "Poppins", vibe: "Friendly geometric" },
  { family: "Baloo 2", vibe: "Playful, loud fast-food" },
  { family: "Fredoka", vibe: "Rounded, fun" },
  { family: "Nunito", vibe: "Soft and approachable" },
  { family: "Rubik", vibe: "Contemporary, slightly quirky" },
  { family: "Montserrat", vibe: "Confident urban" },
  { family: "DM Sans", vibe: "Clean minimal" },
  { family: "Manrope", vibe: "Modern tech" },
  { family: "Work Sans", vibe: "Understated professional" },
  { family: "Sora", vibe: "Sharp, premium" },
  { family: "Playfair Display", vibe: "Elegant serif, fine dining" },
  { family: "Lora", vibe: "Warm literary serif" },
  { family: "Oswald", vibe: "Tall condensed, bold menus" },
  { family: "Bebas Neue", vibe: "All-caps display punch" },
  { family: "Righteous", vibe: "Retro diner" },
];

export const curatedFontFamilies = curatedFonts.map((f) => f.family);

// One stylesheet href covering the whole curated list at preview weights, loaded ONLY inside
// Studio so the picker can render each family in itself. Public menu pages keep loading just
// the two families their config uses (theme-provider.tsx).
export function curatedFontsPreviewHref(): string {
  const params = curatedFonts
    .map((f) => `family=${encodeURIComponent(f.family)}:wght@400;600`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
