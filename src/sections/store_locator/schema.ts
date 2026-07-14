import { z } from "zod";

export const storeLocatorSchema = z.object({
  heading: z.string().default("Our Locations"),
  branches: z
    .array(
      z.object({
        name: z.string().default(""),
        address: z.string().default(""),
        phone: z.string().default(""),
      })
    )
    .default([]),
});

export type StoreLocatorSettings = z.infer<typeof storeLocatorSchema>;
