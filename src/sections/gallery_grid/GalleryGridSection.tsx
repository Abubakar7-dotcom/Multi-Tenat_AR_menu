import type { SectionComponentProps } from "../types";
import type { GalleryGridSettings } from "./schema";

// Photo-forward grid with optional captions, not tied 1:1 to purchasable items (PLAN.md §3 #9)
// — e.g. Anatummy's moody plating shots. Columns drive an inline grid-template (Hard Rule #2).
export function GalleryGridSection({
  settings,
}: SectionComponentProps<GalleryGridSettings>) {
  const images = settings.images.filter((img) => img.url);
  if (images.length === 0) return null;

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
        gap: "calc(var(--spacing-unit) * 2)",
      }}
    >
      {images.map((img, i) => (
        <figure
          key={`${img.url}-${i}`}
          className="overflow-hidden"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env. */}
          <img
            src={img.url}
            alt={img.caption || ""}
            className="aspect-square w-full object-cover"
          />
          {img.caption ? (
            <figcaption
              className="p-2 text-xs"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)",
              }}
            >
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
