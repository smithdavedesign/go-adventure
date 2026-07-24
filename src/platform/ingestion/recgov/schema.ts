/**
 * Zod schema for the subset of the Recreation.gov RIDB `/recareas` object we
 * consume. Strict on mapped fields; lenient on the rest.
 */
import { z } from "zod";

export const recAreaSchema = z.object({
  RecAreaID: z.union([z.string(), z.number()]).transform((v) => String(v)),
  RecAreaName: z.string().min(1),
  RecAreaDescription: z.string().optional().default(""),
  RecAreaLatitude: z.coerce.number().min(-90).max(90),
  RecAreaLongitude: z.coerce.number().min(-180).max(180),
});

export type RecArea = z.infer<typeof recAreaSchema>;

export const ridbResponseSchema = z.object({
  RECDATA: z.array(z.unknown()),
});
