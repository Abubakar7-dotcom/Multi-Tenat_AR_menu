import { z } from "zod";

export const bundleComparisonSchema = z.object({
  categoryId: z.string().default(""),
  itemIds: z.array(z.string()).default([]),
  heading: z.string().default(""),
  layout: z.enum(["table", "cards"]).default("cards"),
});

export type BundleComparisonSettings = z.infer<typeof bundleComparisonSchema>;
