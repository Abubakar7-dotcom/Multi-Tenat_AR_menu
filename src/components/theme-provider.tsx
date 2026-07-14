import type { CSSProperties, ReactNode } from "react";
import {
  fontFamiliesInUse,
  resolveTokensToCssVars,
  type Tokens,
} from "@/lib/theme/tokens";

// Build a Google Fonts stylesheet href for the families a config actually uses. Requesting a
// fixed set of common weights keeps the URL deterministic; families are the curated Studio
// list (PLAN.md §4a). Loading fonts by config value is fine — it's a URL, not a runtime
// Tailwind class, so Hard Rule #2 is not in play here.
function googleFontsHref(families: string[]): string | null {
  if (families.length === 0) return null;
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

interface ThemeProviderProps {
  tokens: Tokens;
  children: ReactNode;
}

// Layer 1 renderer: turns the token object into CSS custom properties on a wrapping element,
// server-side, so every descendant section can read var(--color-*), var(--font-*), etc. This
// is the ONLY place tokens become concrete values — sections themselves only ever reference
// the variables (Hard Rule #5).
export function ThemeProvider({ tokens, children }: ThemeProviderProps) {
  const cssVars = resolveTokensToCssVars(tokens);
  const fontsHref = googleFontsHref(fontFamiliesInUse(tokens));

  const style: CSSProperties = {
    ...cssVars,
    backgroundColor: "var(--color-background)",
    backgroundImage: "var(--bg-texture-url)",
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
    minHeight: "100vh",
  } as CSSProperties;

  return (
    <>
      {fontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={fontsHref} />
        </>
      ) : null}
      <div style={style}>{children}</div>
    </>
  );
}
