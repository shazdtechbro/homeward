import "server-only";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
  type BedrockRuntimeClientConfig,
  type ContentBlock,
} from "@aws-sdk/client-bedrock-runtime";
import type { Embedder } from "@/core/ports";
import { parseJsonObject, type JsonModel, type Part } from "@/infra/ai/model";
import { logger } from "@/lib/logger";

/** Amazon Nova through the Bedrock Converse API: Amazon's own models, text and vision. */
export class Bedrock implements JsonModel {
  readonly name = "bedrock";
  private readonly client: BedrockRuntimeClient;

  constructor(
    config: BedrockRuntimeClientConfig,
    readonly textModel: string,
    readonly embedModel: string,
  ) {
    this.client = new BedrockRuntimeClient(config);
  }

  async json<T>(system: string, parts: Part[], maxTokens = 500): Promise<T> {
    const content: ContentBlock[] = parts.map((part) =>
      "image" in part
        ? { image: { format: "jpeg", source: { bytes: part.image } } }
        : { text: part.text },
    );
    const result = await this.client.send(
      new ConverseCommand({
        modelId: this.textModel,
        system: [{ text: `${system}\nReply with one JSON object and nothing else.` }],
        messages: [{ role: "user", content }],
        inferenceConfig: { maxTokens, temperature: 0 },
      }),
    );
    return parseJsonObject<T>(
      result.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "",
    );
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.client.send(
      new InvokeModelCommand({
        modelId: this.embedModel,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ inputText: text.slice(0, 2000), dimensions: 512, normalize: true }),
      }),
    );
    const { embedding } = JSON.parse(new TextDecoder().decode(result.body)) as {
      embedding: number[];
    };
    return embedding;
  }
}

export class TitanEmbedder implements Embedder {
  constructor(private readonly bedrock: Bedrock) {}

  async embed(text: string) {
    try {
      return await this.bedrock.embed(text);
    } catch (error) {
      logger.warn("ai.embed_failed", { message: String(error).slice(0, 200) });
      return undefined;
    }
  }
}
