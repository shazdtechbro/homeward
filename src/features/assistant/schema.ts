import { z } from "zod";
import type { SearchResponse } from "@/features/ai-demo/schema";

export const assistantRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(400),
      }),
    )
    .min(1)
    .max(16)
    .refine((m) => m.at(-1)?.role === "user", "The last message must be from the student."),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

/** The stream is newline-delimited JSON: one result, then text tokens, then done. */
export type AssistantEvent =
  | { type: "result"; result: SearchResponse; privateMatchId?: string; hasMatric: boolean }
  | { type: "token"; text: string }
  | { type: "suggestions"; items: string[] }
  | { type: "done" };
