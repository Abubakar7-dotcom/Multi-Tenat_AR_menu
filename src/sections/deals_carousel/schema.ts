import { z } from "zod";

export const dealsCarouselSchema = z.object({
  itemIds: z.array(z.string()).default([]),
  heading: z.string().default("Deals"),
  autoScroll: z.boolean().default(false),
});

export type DealsCarouselSettings = z.infer<typeof dealsCarouselSchema>;
