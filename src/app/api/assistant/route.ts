import { assistantRequestSchema, type AssistantEvent } from "@/features/assistant/schema";
import {
  fallbackReply,
  suggestions,
  systemPrompt,
  toTurns,
} from "@/features/assistant/server/reply";
import { searchLostItem } from "@/features/ai-demo/server/search-lost-item";
import { getServices } from "@/infra/container";
import { AppError, toErrorResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { currentUser } from "@/lib/session";

const checkRate = createRateLimiter({ limit: 20, windowMs: 60_000 });

/**
 * The lost-item assistant. Searches with everything the student has said so
 * far, sends the matches immediately, then streams a warm reply grounded in
 * those results. Newline-delimited JSON, so the browser can render as it arrives.
 */
export async function POST(request: Request) {
  try {
    checkRate(clientKey(request));
    const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError("invalid_input", parsed.error.issues[0]?.message ?? "Invalid request.");
    }
    const { messages } = parsed.data;
    const services = getServices();
    const said = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(". ");

    const [result, user] = await Promise.all([searchLostItem(said, services), currentUser()]);
    let privateMatchId: string | undefined;
    if (result.outcome.kind === "private" && user?.matric) {
      const cards = await services.items.listOpen({ category: "id-card" });
      privateMatchId = cards.find((c) => c.matric === user.matric)?.id;
    }
    const hasMatric = Boolean(user?.matric);
    logger.info("assistant.turn", { outcome: result.outcome.kind, turns: messages.length });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: AssistantEvent) =>
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

        send({ type: "result", result, privateMatchId, hasMatric });
        let wrote = false;
        if (services.chat) {
          try {
            const system = systemPrompt(result, Boolean(privateMatchId), hasMatric);
            for await (const text of services.chat.stream(system, toTurns(messages))) {
              wrote = true;
              send({ type: "token", text });
            }
          } catch (error) {
            logger.warn("assistant.stream_failed", { message: String(error).slice(0, 200) });
          }
        }
        if (!wrote) {
          // No model available: still answer, a few words at a time.
          for (const word of fallbackReply(result, Boolean(privateMatchId)).split(/(?<= )/)) {
            send({ type: "token", text: word });
            await new Promise((r) => setTimeout(r, 25));
          }
        }
        send({ type: "suggestions", items: suggestions(result) });
        send({ type: "done" });
        controller.close();
      },
    });

    return new Response(body, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("assistant.failed", { message: String(error) });
    return toErrorResponse(error);
  }
}
