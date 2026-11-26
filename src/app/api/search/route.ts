import { searchRequestSchema } from "@/features/ai-demo/schema";
import { searchLostItem } from "@/features/ai-demo/server/search-lost-item";
import { getServices } from "@/infra/container";
import { AppError, toErrorResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const checkRate = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  try {
    checkRate(clientKey(request));

    const parsed = searchRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError("invalid_input", parsed.error.issues[0]?.message ?? "Invalid request.");
    }

    const result = await searchLostItem(parsed.data.text, getServices());
    logger.info("search.completed", { outcome: result.outcome.kind, fields: result.fields.length });
    return Response.json(result);
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("search.failed", { message: String(error) });
    return toErrorResponse(error);
  }
}
