import { z } from "zod";

export const itemSpotlightSchema = z.object({
  itemId: z.string().default(""),
  heading: z.string().default(""),
  ctaLabel: z.string().default("View on Table"),
});

export type ItemSpotlightSettings = z.infer<typeof itemSpotlightSchema>;
