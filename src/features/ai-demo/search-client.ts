import { searchResponseSchema, type SearchResponse } from "./schema";

/**
 * The landing demo's only network call. Which parser answers (keyword rules
 * or Amazon Nova) is decided server-side in the container.
 */
export async function searchLostItem(text: string, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (body as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(message ?? "Search is unavailable right now.");
  }
  return searchResponseSchema.parse(body);
}

export function randomPickupCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}
