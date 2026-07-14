import { z } from "zod";

export const heroBannerSchema = z.object({
  imageUrl: z.string().default(""),
  heading: z.string().default(""),
  subheading: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaTargetSectionId: z.string().default(""), // scrolls to another section on this page
  overlayOpacity: z.number().min(0).max(1).default(0.3),
});

export type HeroBannerSettings = z.infer<typeof heroBannerSchema>;
