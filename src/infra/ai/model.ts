import "server-only";
import { logger } from "@/lib/logger";

/** One piece of a prompt: text, or a JPEG photo. */
export type Part = { text: string } | { image: Uint8Array };

/** A model that answers a prompt with one JSON object. Every AI feature is built on this. */
export interface JsonModel {
  readonly name: string;
  json<T>(system: string, parts: Part[], maxTokens?: number): Promise<T>;
}

/** Pulls the first {...} block out of a reply, tolerating prose or code fences around it. */
export function parseJsonObject<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`Model did not return JSON: ${text.slice(0, 120)}`);
  return JSON.parse(text.slice(start, end + 1)) as T;
}

const COOL_DOWN_MS = 10 * 60_000;

/**
 * Tries the primary model, and on any failure answers from the secondary.
 * After a failure the primary is skipped for a cool-down, so users don't pay
 * its error latency on every request; it is retried automatically afterwards.
 */
export class FailoverModel implements JsonModel {
  private primaryDownUntil = 0;

  constructor(
    private readonly primary: JsonModel,
    private readonly secondary: JsonModel,
  ) {}

  get name() {
    return `${this.primary.name} → ${this.secondary.name}`;
  }

  async json<T>(system: string, parts: Part[], maxTokens?: number): Promise<T> {
    if (Date.now() >= this.primaryDownUntil) {
      try {
        return await this.primary.json<T>(system, parts, maxTokens);
      } catch (error) {
        this.primaryDownUntil = Date.now() + COOL_DOWN_MS;
        logger.warn("ai.failover", {
          from: this.primary.name,
          message: String(error).slice(0, 160),
        });
      }
    }
    return this.secondary.json<T>(system, parts, maxTokens);
  }
}
