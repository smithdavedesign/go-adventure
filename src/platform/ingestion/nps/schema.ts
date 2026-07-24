/**
 * Zod schema for the subset of the NPS Data API `/parks` object we consume.
 * Validation is strict on the fields we map and lenient on the rest — an
 * unexpected extra field from NPS shouldn't fail ingestion, but a missing
 * coordinate or malformed lat/lng must.
 *
 * NPS returns latitude/longitude as strings; we coerce and range-check them.
 */
import { z } from "zod";

export const npsActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const npsParkSchema = z.object({
  parkCode: z.string().min(1),
  fullName: z.string().min(1),
  description: z.string().optional().default(""),
  // Coerce string coordinates to numbers, then bound to valid WGS84 ranges.
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  url: z.string().url(),
  designation: z.string().optional().default(""),
  activities: z.array(npsActivitySchema).optional().default([]),
});

export type NpsPark = z.infer<typeof npsParkSchema>;

/** The `/parks` list response envelope. */
export const npsParksResponseSchema = z.object({
  total: z.union([z.string(), z.number()]).optional(),
  data: z.array(z.unknown()),
});
