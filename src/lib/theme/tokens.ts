import { z } from "zod";

// Layer 1 — design tokens. This is the token dictionary from PLAN.md §4, and it is
// APPEND-ONLY FOREVER (Hard Rule #3): add new tokens with defaults, never rename or remove an
// existing key — stored restaurant configs reference these keys by exact string and must keep
// parsing. Every field has .default() so tokenSchema.parse({}) always yields a complete,
// valid theme (old/partial configs never fail to parse).

export const cornerRadiusValues = ["sharp", "soft", "rounded"] as const;
export const buttonShapeValues = ["square", "rounded", "pill"] as const;
export const spacingDensityValues = ["compact", "comfortable", "spacious"] as const;
export const cardShadowValues = ["none", "soft", "medium", "hard"] as const;

export const tokenSchema = z.object({
  colorPrimary: z.string().default("#111111"),
  colorPrimaryContrast: z.string().default("#FFFFFF"),
  colorAccent: z.string().default("#666666"),
  colorAccentContrast: z.string().default("#FFFFFF"),
  colorBackground: z.string().default("#FFFFFF"),
  colorSurface: z.string().default("#F5F5F5"),
  colorText: z.string().default("#1A1A1A"),
  colorTextMuted: z.string().default("#6B6B6B"),
  fontHeading: z.string().default("Inter"),
  fontBody: z.string().default("Inter"),
  cornerRadius: z.enum(cornerRadiusValues).default("soft"),
  buttonShape: z.enum(buttonShapeValues).default("rounded"),
  spacingDensity: z.enum(spacingDensityValues).default("comfortable"),
  cardShadow: z.enum(cardShadowValues).default("none"),
  backgroundTextureUrl: z.string().default(""),
});

export type Tokens = z.infer<typeof tokenSchema>;

// Enum tokens resolve to concrete CSS values via these fixed lookup tables (PLAN.md §4). This
// server-side resolution is exactly what keeps Hard Rule #2 satisfied: Studio presents these
// as dropdowns, but they never become runtime-interpolated Tailwind classes — they become
// plain CSS custom-property values.
const radiusCardMap: Record<(typeof cornerRadiusValues)[number], string> = {
  sharp: "0px",
  soft: "8px",
  rounded: "16px",
};

const radiusButtonMap: Record<(typeof buttonShapeValues)[number], string> = {
  square: "0px",
  rounded: "8px",
  pill: "9999px",
};

const spacingUnitMap: Record<(typeof spacingDensityValues)[number], string> = {
  compact: "4px",
  comfortable: "6px",
  spacious: "8px",
};

const shadowCardMap: Record<(typeof cardShadowValues)[number], string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,0.10)",
  medium: "0 4px 12px rgba(0,0,0,0.14)",
  hard: "0 8px 24px rgba(0,0,0,0.22)",
};

// A curated web-safe fallback stack appended after the token-selected family, so a slow/failed
// Google Fonts load never leaves text unstyled.
const FONT_FALLBACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function fontStack(family: string): string {
  const trimmed = family.trim();
  if (!trimmed) return FONT_FALLBACK;
  // Quote multi-word family names for CSS.
  const quoted = /\s/.test(trimmed) ? `'${trimmed}'` : trimmed;
  return `${quoted}, ${FONT_FALLBACK}`;
}

// The full set of CSS custom properties every section reads from (PLAN.md §4 "CSS variable"
// column). Sections style EXCLUSIVELY through these (Hard Rule #5) — a section that hardcodes
// a hex or font-family is a bug the design-system-reviewer will flag.
export function resolveTokensToCssVars(tokens: Tokens): Record<string, string> {
  return {
    "--color-primary": tokens.colorPrimary,
    "--color-primary-contrast": tokens.colorPrimaryContrast,
    "--color-accent": tokens.colorAccent,
    "--color-accent-contrast": tokens.colorAccentContrast,
    "--color-background": tokens.colorBackground,
    "--color-surface": tokens.colorSurface,
    "--color-text": tokens.colorText,
    "--color-text-muted": tokens.colorTextMuted,
    "--font-heading": fontStack(tokens.fontHeading),
    "--font-body": fontStack(tokens.fontBody),
    "--radius-card": radiusCardMap[tokens.cornerRadius],
    "--radius-button": radiusButtonMap[tokens.buttonShape],
    "--spacing-unit": spacingUnitMap[tokens.spacingDensity],
    "--shadow-card": shadowCardMap[tokens.cardShadow],
    "--bg-texture-url": tokens.backgroundTextureUrl
      ? `url("${tokens.backgroundTextureUrl}")`
      : "none",
  };
}

// The two font families a config actually uses, for building the Google Fonts <link>.
export function fontFamiliesInUse(tokens: Tokens): string[] {
  const families = new Set<string>();
  if (tokens.fontHeading.trim()) families.add(tokens.fontHeading.trim());
  if (tokens.fontBody.trim()) families.add(tokens.fontBody.trim());
  return [...families];
}
