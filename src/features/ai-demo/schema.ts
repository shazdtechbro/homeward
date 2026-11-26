import { z } from "zod";

export const searchRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(8, "Tell us a little more: what, where and roughly when.")
    .max(280, "Keep it under 280 characters."),
});

const fieldSchema = z.object({
  label: z.enum(["Category", "Colour", "Brand", "Place", "When"]),
  value: z.string(),
  evidence: z.string(),
});

const matchSchema = z.object({
  id: z.string(),
  title: z.string(),
  place: z.string(),
  when: z.string(),
  score: z.number().int().min(0).max(100),
  imageKey: z.string(),
  readyAtSpot: z.boolean(),
});

export const searchResponseSchema = z.object({
  fields: z.array(fieldSchema),
  scanned: z.number().int().nonnegative(),
  outcome: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("matches"), matches: z.array(matchSchema).min(1) }),
    /** Sensitive items (ID cards) are matched by matric number and never listed. */
    z.object({ kind: z.literal("private") }),
    z.object({ kind: z.literal("none") }),
  ]),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type ParsedField = z.infer<typeof fieldSchema>;
export type MatchView = z.infer<typeof matchSchema>;
