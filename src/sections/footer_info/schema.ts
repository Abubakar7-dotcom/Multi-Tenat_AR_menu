import { z } from "zod";

export const footerInfoSchema = z.object({
  showNewsletter: z.boolean().default(false),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().default(""),
        url: z.string().default(""),
      })
    )
    .default([]),
  contactPhone: z.string().default(""),
  contactAddress: z.string().default(""),
});

export type FooterInfoSettings = z.infer<typeof footerInfoSchema>;
