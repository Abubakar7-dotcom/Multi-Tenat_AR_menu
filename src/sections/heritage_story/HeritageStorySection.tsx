import type { SectionComponentProps } from "../types";
import type { HeritageStorySettings } from "./schema";

// Rich text + image brand-story block (PLAN.md §3 #7), e.g. Tehzeeb's "114 Years of Legacy" or
// OPTP's founder story. Image side is config-driven; stacks on narrow widths.
export function HeritageStorySection({
  settings,
}: SectionComponentProps<HeritageStorySettings>) {
  const { imageUrl, heading, body, imagePosition } = settings;
  if (!imageUrl && !heading && !body) return null;

  const image = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env.
    <img
      src={imageUrl}
      alt={heading || ""}
      className="w-full flex-1 object-cover"
      style={{ borderRadius: "var(--radius-card)" }}
    />
  ) : null;

  const text = (
    <div className="flex-1">
      {heading ? (
        <h2
          className="mb-2 text-xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {heading}
        </h2>
      ) : null}
      {body ? (
        <p
          className="whitespace-pre-line text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      className="flex flex-col items-center sm:flex-row"
      style={{ gap: "calc(var(--spacing-unit) * 3)" }}
    >
      {imagePosition === "left" ? (
        <>
          {image}
          {text}
        </>
      ) : (
        <>
          {text}
          {image}
        </>
      )}
    </div>
  );
}
