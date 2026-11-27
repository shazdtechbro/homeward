import "server-only";
import {
  DetectLabelsCommand,
  DetectModerationLabelsCommand,
  DetectTextCommand,
  RekognitionClient,
  type RekognitionClientConfig,
} from "@aws-sdk/client-rekognition";
import { CATEGORIES, type Category } from "@/core/domain/item";
import type { ImageAnalysis, ImageAnalyzer } from "@/core/ports";
import { logger } from "@/lib/logger";
import type { Bedrock } from "./bedrock";

/** Rekognition label → our category. Most specific first. */
const LABEL_TO_CATEGORY: Array<[string, Category]> = [
  ["Id Cards", "id-card"],
  ["Driving License", "id-card"],
  ["Laptop", "laptop"],
  ["Mobile Phone", "phone"],
  ["Cell Phone", "phone"],
  ["Phone", "phone"],
  ["Headphones", "earbuds"],
  ["Calculator", "calculator"],
  ["Key", "keys"],
  ["Backpack", "bag"],
  ["Handbag", "bag"],
  ["Bag", "bag"],
  ["Glasses", "glasses"],
  ["Sunglasses", "glasses"],
  ["Wristwatch", "watch"],
  ["Watch", "watch"],
  ["Umbrella", "umbrella"],
  ["Water Bottle", "bottle"],
  ["Bottle", "bottle"],
  ["Notebook", "notebook"],
  ["Book", "notebook"],
  ["Scarf", "scarf"],
  ["Adapter", "charger"],
  ["Cable", "charger"],
];

const COLOURS = ["black", "white", "grey", "silver", "blue", "green", "red", "orange", "brown", "pink", "yellow", "purple"];

/** UNILORIN matric numbers, e.g. 19/52HA041. */
const MATRIC = /\b\d{2}\s*\/\s*\d{2}[A-Z]{2}\d{3}\b/i;

type NovaDraft = {
  title?: string;
  category?: string;
  colour?: string;
  brand?: string | null;
  description?: string;
  question?: string;
};

const DRAFT_PROMPT = `You help a student at the University of Ilorin post a found item to a lost-and-found app.
Look at the photo. Rekognition saw these labels: {labels}.
Write a draft listing:
- title: 2–5 words, e.g. "Black HP laptop"
- category: one of ${CATEGORIES.join(", ")}
- colour: one lowercase colour word
- brand: the brand if clearly visible, else null
- description: one neutral sentence describing it. Never include names, ID numbers, phone numbers or anything personal you can read.
- question: a question only the real owner could answer, about something NOT visible in this photo (e.g. "What's the lock-screen picture?", "What's in the front pocket?")
Shape: {"title":..., "category":..., "colour":..., "brand":..., "description":..., "question":...}`;

/**
 * Rekognition does the seeing (labels, text, safety), Nova does the writing.
 * They run in parallel; any part that fails just leaves its fields empty.
 */
export class AwsImageAnalyzer implements ImageAnalyzer {
  private readonly rekognition: RekognitionClient;

  constructor(
    config: RekognitionClientConfig,
    private readonly bedrock: Bedrock,
  ) {
    this.rekognition = new RekognitionClient(config);
  }

  private async labels(bytes: Uint8Array) {
    const result = await this.rekognition.send(
      new DetectLabelsCommand({
        Image: { Bytes: bytes },
        MaxLabels: 25,
        MinConfidence: 60,
        Features: ["GENERAL_LABELS", "IMAGE_PROPERTIES"],
      }),
    );
    const labels = (result.Labels ?? []).map((l) => l.Name ?? "").filter(Boolean);
    const colour = (result.ImageProperties?.DominantColors ?? [])
      .map((c) => c.SimplifiedColor?.toLowerCase())
      .find((c): c is string => !!c && COLOURS.includes(c));
    return { labels, colour, category: LABEL_TO_CATEGORY.find(([l]) => labels.includes(l))?.[1] };
  }

  private async unsafe(bytes: Uint8Array) {
    const result = await this.rekognition.send(
      new DetectModerationLabelsCommand({ Image: { Bytes: bytes }, MinConfidence: 80 }),
    );
    return (result.ModerationLabels ?? []).length > 0;
  }

  private async matric(bytes: Uint8Array) {
    const result = await this.rekognition.send(new DetectTextCommand({ Image: { Bytes: bytes } }));
    const lines = (result.TextDetections ?? []).filter((t) => t.Type === "LINE").map((t) => t.DetectedText ?? "");
    return lines.map((l) => MATRIC.exec(l)?.[0]).find(Boolean)?.replace(/\s/g, "").toUpperCase();
  }

  private async draft(bytes: Uint8Array, labels: string[]) {
    return this.bedrock.json<NovaDraft>(DRAFT_PROMPT.replace("{labels}", labels.join(", ") || "none"), [
      { image: { format: "jpeg", source: { bytes } } },
      { text: "Draft the listing for this found item." },
    ]);
  }

  async isUnsafe(bytes: Uint8Array) {
    try {
      return await this.unsafe(bytes);
    } catch (error) {
      logger.warn("ai.moderation_failed", { message: String(error).slice(0, 200) });
      return false;
    }
  }

  async analyze(bytes: Uint8Array): Promise<ImageAnalysis> {
    const settle = <T>(p: Promise<T>, what: string) =>
      p.catch((error) => {
        logger.warn(`ai.vision_${what}_failed`, { message: String(error).slice(0, 200) });
        return undefined;
      });

    const seen = await settle(this.labels(bytes), "labels");
    const [unsafe, draft, matric] = await Promise.all([
      settle(this.unsafe(bytes), "moderation"),
      settle(this.draft(bytes, seen?.labels ?? []), "draft"),
      seen?.category === "id-card" || seen?.labels.includes("Text") ? settle(this.matric(bytes), "text") : undefined,
    ]);

    const novaCategory = (CATEGORIES as readonly string[]).includes(draft?.category ?? "") ? (draft!.category as Category) : undefined;
    const category = seen?.category ?? novaCategory;
    const colour = draft?.colour && COLOURS.includes(draft.colour) ? draft.colour : seen?.colour;

    return {
      labels: (seen?.labels ?? []).slice(0, 8),
      category,
      colour,
      brand: draft?.brand ?? undefined,
      title: draft?.title?.slice(0, 60),
      description: draft?.description?.slice(0, 280),
      question: draft?.question?.slice(0, 120),
      matric: category === "id-card" ? matric : undefined,
      unsafe: unsafe ?? false,
    };
  }
}
