"use server";

import { headers } from "next/headers";
import { searchRequestSchema, type SearchResponse } from "@/features/ai-demo/schema";
import { searchLostItem } from "@/features/ai-demo/server/search-lost-item";
import { getServices } from "@/infra/container";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { currentUser } from "@/lib/session";

const checkRate = createRateLimiter({ limit: 15, windowMs: 60_000 });

export type LostSearchResult =
  | { ok: true; result: SearchResponse; privateMatchId?: string; hasMatric: boolean }
  | { ok: false; message: string };

export async function searchLost(text: string): Promise<LostSearchResult> {
  const parsed = searchRequestSchema.safeParse({ text });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Describe what you lost." };

  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    checkRate(ip);
    const services = getServices();
    const [result, user] = await Promise.all([searchLostItem(parsed.data.text, services), currentUser()]);

    // ID cards are never listed: look only for the card that carries this student's matric.
    let privateMatchId: string | undefined;
    if (result.outcome.kind === "private" && user?.matric) {
      const cards = await services.items.listOpen({ category: "id-card" });
      privateMatchId = cards.find((c) => c.matric === user.matric)?.id;
    }
    logger.info("lost.search", { outcome: result.outcome.kind, privateMatch: Boolean(privateMatchId) });
    return { ok: true, result, privateMatchId, hasMatric: Boolean(user?.matric) };
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("lost.search_failed", { message: String(error) });
    return { ok: false, message: error instanceof AppError ? error.message : "Search failed. Try again." };
  }
}
