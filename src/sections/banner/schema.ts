import { z } from "zod";

export const bannerSchema = z.object({
  variant: z.enum(["promo", "trust", "app_download"]).default("promo"),
  imageUrl: z.string().default(""),
  heading: z.string().default(""),
  body: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaUrl: z.string().default(""),
  dismissible: z.boolean().default(false),
});

export type BannerSettings = z.infer<typeof bannerSchema>;
