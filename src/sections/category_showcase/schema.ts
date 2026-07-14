import { z } from "zod";

export const categoryShowcaseSchema = z.object({
  categoryIds: z.array(z.string()).default([]), // empty = all categories
  columns: z.number().int().min(2).max(5).default(4),
  showIcons: z.boolean().default(true),
});

export type CategoryShowcaseSettings = z.infer<typeof categoryShowcaseSchema>;
