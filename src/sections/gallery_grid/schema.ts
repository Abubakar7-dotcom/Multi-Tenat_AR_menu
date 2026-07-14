import { z } from "zod";

export const galleryGridSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().default(""),
        caption: z.string().default(""),
      })
    )
    .default([]),
  columns: z.number().int().min(2).max(4).default(3),
});

export type GalleryGridSettings = z.infer<typeof galleryGridSchema>;
