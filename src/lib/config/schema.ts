import { z } from "zod";
import { tokenSchema } from "@/lib/theme/tokens";

// Layer 2 — layout shell (PLAN.md §2 layer list + §3 coverage matrix). Enum values are
// append-only like everything else. `icon-grid` is the 4th categoryNavStyle added for Tehzeeb
// Bakers (PLAN.md §3 coverage verdict).
export const headerStyleValues = [
  "centered-logo",
  "logo-plus-menu",
  "sticky-bar",
] as const;

export const categoryNavStyleValues = [
  "pills",
  "tabs",
  "sidebar-drawer",
  "icon-grid",
] as const;

export const sectionSpacingValues = ["tight", "normal", "relaxed"] as const;

export const layoutShellSchema = z.object({
  headerStyle: z.enum(headerStyleValues).default("centered-logo"),
  categoryNavStyle: z.enum(categoryNavStyleValues).default("pills"),
  pageMaxWidth: z.number().int().min(320).max(1280).default(640),
  sectionSpacing: z.enum(sectionSpacingValues).default("normal"),
});

export type LayoutShell = z.infer<typeof layoutShellSchema>;

// Layer 3 — a section instance. Validated loosely here on purpose: `type` is any string and
// `settings` any object. Each section's real settings schema (Layer 4) is applied by the
// renderer at render time via the registry, so:
//   - a config referencing a section type this deploy doesn't know is skipped, not fatal;
//   - missing settings fields are filled from that section's zod defaults at render time.
// This is what makes "old configs in the DB must always parse" (Hard Rule #3) hold even as
// the registry grows across deploys.
export const sectionInstanceSchema = z.object({
  id: z.string(),
  type: z.string(),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export type SectionInstance = z.infer<typeof sectionInstanceSchema>;

// The full restaurant config stored in restaurants.draft_config / published_config (JSONB).
// Every field defaults, so an empty {} (brand-new restaurant) parses into a valid, renderable
// config: default theme, default shell, zero sections.
export const configSchema = z.object({
  // .prefault({}) (not .default({})) so a missing tokens/layoutShell substitutes an empty
  // object that is THEN parsed — letting each field's own .default() fill in. zod v4's
  // .default() would instead require the complete output object here.
  tokens: tokenSchema.prefault({}),
  layoutShell: layoutShellSchema.prefault({}),
  sections: z.array(sectionInstanceSchema).default([]),
});

export type RestaurantConfig = z.infer<typeof configSchema>;

// Parse an unknown JSONB value from the DB into a guaranteed-valid config. Falls back to an
// all-defaults config if the stored value is somehow not even object-shaped, so the public
// page can never hard-crash on malformed config.
export function parseConfig(raw: unknown): RestaurantConfig {
  const result = configSchema.safeParse(raw ?? {});
  return result.success ? result.data : configSchema.parse({});
}
