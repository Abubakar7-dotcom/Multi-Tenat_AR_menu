import type { SectionComponentProps } from "../types";
import type { HeroBannerSettings } from "./schema";

// Full-width hero. Over an image, the scrim uses var(--color-text) and the text uses
// var(--color-background) — an inversion of the theme's own pair, so contrast stays readable
// on the photo without any hardcoded white/black (Hard Rule #5). With no image it renders on
// var(--color-surface) with normal text.
export function HeroBannerSection({
  settings,
}: SectionComponentProps<HeroBannerSettings>) {
  const {
    imageUrl,
    heading,
    subheading,
    ctaLabel,
    ctaTargetSectionId,
    overlayOpacity,
  } = settings;

  // Nothing to show at all → render nothing (must survive empty/default settings).
  if (!imageUrl && !heading && !subheading && !ctaLabel) return null;

  const onImage = Boolean(imageUrl);
  const textColor = onImage ? "var(--color-background)" : "var(--color-text)";

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center"
      style={{
        minHeight: onImage ? "260px" : undefined,
        padding: "calc(var(--spacing-unit) * 8) calc(var(--spacing-unit) * 4)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        backgroundColor: onImage ? undefined : "var(--color-surface)",
        backgroundImage: onImage ? `url("${imageUrl}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {onImage ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "var(--color-text)",
            opacity: overlayOpacity,
          }}
        />
      ) : null}

      <div className="relative flex flex-col items-center gap-2">
        {heading ? (
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {heading}
          </h2>
        ) : null}
        {subheading ? <p className="text-sm opacity-90">{subheading}</p> : null}
        {ctaLabel ? (
          <a
            href={ctaTargetSectionId ? `#${ctaTargetSectionId}` : undefined}
            className="mt-2 inline-block px-5 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-contrast)",
              borderRadius: "var(--radius-button)",
            }}
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
