// WCAG 2.x relative-luminance contrast ratio between two #rrggbb colors. Used by Studio's
// theme tab to warn when a token pair would produce unreadable text. Pure math, no DOM.

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

// Returns the ratio (1–21), or null if either color isn't a parseable 6-digit hex (e.g. a CSS
// color name — we simply don't warn in that case rather than guessing).
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return null;
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastWarning {
  pair: string;
  ratio: number;
}

// The token pairs that render as text-on-background somewhere in the section library. 4.5:1 is
// the WCAG AA threshold for normal text; we warn below it rather than block (the admin may be
// styling a large-display-text-only brand deliberately).
const CHECKED_PAIRS: Array<{ fg: string; bg: string; pair: string }> = [
  { fg: "colorPrimaryContrast", bg: "colorPrimary", pair: "Primary button text on primary" },
  { fg: "colorAccentContrast", bg: "colorAccent", pair: "Accent badge text on accent" },
  { fg: "colorText", bg: "colorBackground", pair: "Body text on background" },
  { fg: "colorText", bg: "colorSurface", pair: "Card text on surface" },
  { fg: "colorTextMuted", bg: "colorSurface", pair: "Muted text on surface" },
];

export function contrastWarnings(tokens: Record<string, unknown>): ContrastWarning[] {
  const warnings: ContrastWarning[] = [];
  for (const { fg, bg, pair } of CHECKED_PAIRS) {
    const fgVal = tokens[fg];
    const bgVal = tokens[bg];
    if (typeof fgVal !== "string" || typeof bgVal !== "string") continue;
    const ratio = contrastRatio(fgVal, bgVal);
    if (ratio !== null && ratio < 4.5) {
      warnings.push({ pair, ratio: Math.round(ratio * 10) / 10 });
    }
  }
  return warnings;
}
