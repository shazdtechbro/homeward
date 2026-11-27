import "server-only";
import { parseJsonObject, type JsonModel, type Part, type Turn } from "./model";

type Options = { baseUrl: string; apiKey: string; textModel: string; visionModel: string };

/**
 * Any provider that speaks the OpenAI chat-completions API. Used as the
 * secondary model behind Bedrock, so the app keeps its AI if Bedrock is unavailable.
 */
export class OpenAiCompatibleModel implements JsonModel {
  readonly name = "secondary";

  constructor(private readonly options: Options) {}

  async json<T>(system: string, parts: Part[], maxTokens = 500): Promise<T> {
    const hasImage = parts.some((part) => "image" in part);
    const content = parts.map((part) =>
      "image" in part
        ? {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${Buffer.from(part.image).toString("base64")}`,
            },
          }
        : { type: "text", text: part.text },
    );

    const send = () =>
      fetch(`${this.options.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: hasImage ? this.options.visionModel : this.options.textModel,
          messages: [
            { role: "system", content: `${system}\nReply with one JSON object and nothing else.` },
            { role: "user", content },
          ],
          // Reasoning models spend tokens thinking before they answer; a tight cap
          // leaves them with nothing to reply with.
          max_tokens: Math.max(maxTokens, 1024),
          temperature: 0,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(15_000),
      });

    // One retry on a dropped connection: campus networks blip.
    let response = await send().catch(() => send());
    // Free tiers cap tokens per minute. Wait out a short limit once instead of failing.
    if (response.status === 429) {
      const wait = Number(response.headers.get("retry-after")) || 2;
      if (wait <= 6) {
        await new Promise((resolve) => setTimeout(resolve, wait * 1000));
        response = await send();
      }
    }
    if (!response.ok)
      throw new Error(`AI provider ${response.status}: ${(await response.text()).slice(0, 160)}`);
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return parseJsonObject<T>(body.choices?.[0]?.message?.content ?? "");
  }

  async *stream(system: string, turns: Turn[], maxTokens = 400): AsyncIterable<string> {
    const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: this.options.textModel,
        messages: [{ role: "system", content: system }, ...turns],
        max_tokens: Math.max(maxTokens, 1024),
        temperature: 0.6,
        stream: true,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok || !response.body) {
      throw new Error(`AI provider ${response.status}: ${(await response.text()).slice(0, 160)}`);
    }
    // Server-sent events: lines of `data: {json}`, ending with `data: [DONE]`.
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, "").trim();
        if (!data || data === "[DONE]" || !line.startsWith("data:")) continue;
        const delta = (JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> })
          .choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  }
}
