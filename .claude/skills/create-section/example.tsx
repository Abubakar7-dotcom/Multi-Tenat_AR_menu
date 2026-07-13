// Reference example for the create-section skill.
// A minimal, compliant section: a text/promo banner block.
// Copy this shape for new sections — do not import or register this file itself.

import { z } from "zod";

// --- schema.ts ---
// Every field has .default(). Required so old DB configs always parse after future
// schema additions (append-only: add new optional/defaulted fields, never remove/rename).
export const promoBannerSchema = z.object({
  heading: z.string().default("Special Offer"),
  body: z.string().default(""),
  align: z.enum(["left", "center", "right"]).default("center"),
  showDivider: z.boolean().default(true),
});

export type PromoBannerSettings = z.infer<typeof promoBannerSchema>;

// --- PromoBannerSection.tsx ---
// Props are always { settings, menuData, tokens } — this component never fetches data
// itself. menuData is unused here since this section doesn't render items, but the prop
// shape is still accepted so the renderer loop stays uniform across all section types.
type MenuData = { categories: unknown[]; items: unknown[] };

interface PromoBannerSectionProps {
  settings: PromoBannerSettings;
  menuData: MenuData;
}

export function PromoBannerSection({ settings }: PromoBannerSectionProps) {
  const { heading, body, align, showDivider } = settings;

  return (
    // Structure/spacing via Tailwind; every token-driven value via CSS variables + inline
    // style. No hex colors, no font-family strings, no Tailwind arbitrary-value classes.
    <section
      className="w-full py-8 px-4"
      style={{
        textAlign: align,
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
      }}
    >
      <h2
        className="text-2xl mb-2"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        {heading}
      </h2>
      {body && (
        <p style={{ fontFamily: "var(--font-body)" }}>{body}</p>
      )}
      {showDivider && (
        <hr
          className="mt-4 border-0 h-px"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
      )}
    </section>
  );
}

// Must render without crashing given all-default settings and empty menu data:
//   <PromoBannerSection
//     settings={promoBannerSchema.parse({})}
//     menuData={{ categories: [], items: [] }}
//   />
