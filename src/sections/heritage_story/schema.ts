import { z } from "zod";

export const heritageStorySchema = z.object({
  imageUrl: z.string().default(""),
  heading: z.string().default(""),
  body: z.string().default(""),
  imagePosition: z.enum(["left", "right"]).default("right"),
});

export type HeritageStorySettings = z.infer<typeof heritageStorySchema>;
