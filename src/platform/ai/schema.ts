/**
 * Schema for AI draft output. Validation is enforced at the boundary — an AI
 * response that doesn't match is rejected, never stored. Bounds keep a
 * misbehaving model from producing an unreasonable payload.
 */
import { z } from "zod";

export const aiDraftOutputSchema = z.object({
  summary: z.string().min(1).max(1200),
  tags: z.array(z.string().min(1).max(40)).max(12),
});

export type AiDraftOutputValidated = z.infer<typeof aiDraftOutputSchema>;
