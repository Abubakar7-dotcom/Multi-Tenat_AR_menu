import { z } from "zod";

// Every field has .default() so schema.parse({}) yields valid settings (create-section rule).
export const menuGridSchema = z.object({
  categoryId: z.string().default(""), // "" = all categories (grouped by category)
  itemIds: z.array(z.string()).default([]), // non-empty overrides categoryId (flat, curated)
  layout: z.enum(["grid", "list"]).default("grid"),
  columns: z.number().int().min(1).max(4).default(2),
  cardImagePosition: z.enum(["top", "left"]).default("top"),
  showDescription: z.enum(["none", "short", "full"]).default("short"),
  showBadge: z.boolean().default(true),
});

export type MenuGridSettings = z.infer<typeof menuGridSchema>;
