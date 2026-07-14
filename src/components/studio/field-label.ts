// "colorPrimary" -> "Color Primary", "ctaLabel" -> "Cta Label". Good enough for an internal
// admin tool — not shown to restaurant staff or diners.
export function fieldLabel(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
