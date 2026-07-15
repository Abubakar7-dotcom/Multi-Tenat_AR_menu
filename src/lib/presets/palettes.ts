import type { Tokens } from "@/lib/theme/tokens";

// One-click color palettes for Studio's theme tab. Each palette sets ONLY the 8 color tokens —
// fonts, radii, spacing etc. are untouched, so an admin can restyle colors without losing the
// rest of their composition (unlike a full preset, which replaces everything).
export type PaletteColors = Pick<
  Tokens,
  | "colorPrimary"
  | "colorPrimaryContrast"
  | "colorAccent"
  | "colorAccentContrast"
  | "colorBackground"
  | "colorSurface"
  | "colorText"
  | "colorTextMuted"
>;

export interface Palette {
  key: string;
  label: string;
  colors: PaletteColors;
}

export const palettes: Palette[] = [
  {
    key: "crimson-fastfood",
    label: "Crimson Fast Food",
    colors: {
      colorPrimary: "#E4002B",
      colorPrimaryContrast: "#FFFFFF",
      colorAccent: "#FFC72C",
      colorAccentContrast: "#1A1A1A",
      colorBackground: "#FFFFFF",
      colorSurface: "#FFF8E1",
      colorText: "#1A1A1A",
      colorTextMuted: "#6B6B6B",
    },
  },
  {
    key: "charcoal-grill",
    label: "Charcoal Grill",
    colors: {
      colorPrimary: "#1F2937",
      colorPrimaryContrast: "#FFFFFF",
      colorAccent: "#F59E0B",
      colorAccentContrast: "#1A1A1A",
      colorBackground: "#FFFFFF",
      colorSurface: "#F3F4F6",
      colorText: "#111827",
      colorTextMuted: "#6B7280",
    },
  },
  {
    key: "fresh-mint",
    label: "Fresh Mint",
    colors: {
      colorPrimary: "#0D9488",
      colorPrimaryContrast: "#FFFFFF",
      colorAccent: "#F97316",
      colorAccentContrast: "#FFFFFF",
      colorBackground: "#FFFFFF",
      colorSurface: "#F0FDFA",
      colorText: "#134E4A",
      colorTextMuted: "#527970",
    },
  },
  {
    key: "desi-heritage",
    label: "Desi Heritage",
    colors: {
      colorPrimary: "#92400E",
      colorPrimaryContrast: "#FFFFFF",
      colorAccent: "#D97706",
      colorAccentContrast: "#FFFFFF",
      colorBackground: "#FFFBEB",
      colorSurface: "#FEF3C7",
      colorText: "#451A03",
      colorTextMuted: "#78716C",
    },
  },
  {
    key: "royal-purple",
    label: "Royal Purple",
    colors: {
      colorPrimary: "#6D28D9",
      colorPrimaryContrast: "#FFFFFF",
      colorAccent: "#F59E0B",
      colorAccentContrast: "#1A1A1A",
      colorBackground: "#FFFFFF",
      colorSurface: "#F5F3FF",
      colorText: "#1E1B4B",
      colorTextMuted: "#6B6B7B",
    },
  },
  {
    key: "midnight",
    label: "Midnight",
    colors: {
      colorPrimary: "#F59E0B",
      colorPrimaryContrast: "#1A1A1A",
      colorAccent: "#38BDF8",
      colorAccentContrast: "#0B0F19",
      colorBackground: "#0B0F19",
      colorSurface: "#111827",
      colorText: "#F9FAFB",
      colorTextMuted: "#9CA3AF",
    },
  },
];
