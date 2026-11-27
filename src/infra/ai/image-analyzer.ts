import "server-only";
import {
  DetectLabelsCommand,
  DetectModerationLabelsCommand,
  RekognitionClient,
  type RekognitionClientConfig,
} from "@aws-sdk/client-rekognition";
import sharp from "sharp";
import { CATEGORIES, type Category } from "@/core/domain/item";
import type { ImageAnalysis, ImageAnalyzer } from "@/core/ports";
import { logger } from "@/lib/logger";
import type { JsonModel } from "./model";

/**
 * Vision models bill by image size and free tiers cap tokens per minute, so the
 * model gets a 640px copy: plenty to recognise an object or read a matric number.
 */
async function forModel(bytes: Uint8Array): Promise<Uint8Array> {
  const small = await sharp(bytes)
    .rotate()
    .resize(640, 640, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
  return new Uint8Array(small);
}

const COLOURS = [
  "black",
  "white",
  "grey",
  "silver",
  "blue",
  "green",
  "red",
  "orange",
  "brown",
  "pink",
  "yellow",
  "purple",
];

/** UNILORIN matric numbers, e.g. 19/52HA041. */
const MATRIC = /\b\d{2}\s*\/\s*\d{2}[A-Z]{2}\d{3}\b/i;

type Reading = {
  labels?: string[];
  title?: string;
  category?: string;
  colour?: string;
  brand?: string | null;
  description?: string;
  question?: string;
  matric?: string | null;
  unsafe?: boolean;
};

const READ_PROMPT = `You help a student at the University of Ilorin post a found item to a lost-and-found app.
Look at the photo and return:
- labels: up to 6 short nouns for what you see, e.g. ["Calculator", "Electronics"]
- title: 2–5 words, e.g. "Black HP laptop"
- category: one of ${CATEGORIES.join(", ")}
- colour: one of ${COLOURS.join(", ")}
- brand: the brand if clearly visible, else null
- description: one neutral sentence. Never include names, ID numbers, phone numbers or anything personal you can read.
- question: a question only the real owner could answer, about something NOT visible in this photo ("What's the lock-screen picture?")
- matric: only if this is a student ID card, the matric number printed on it (format like 19/52HA041), else null
- unsafe: true if the photo contains nudity, violence, gore, or is not a photo of an object at all
Shape: {"labels":[], "title":..., "category":..., "colour":..., "brand":..., "description":..., "question":..., "matric":..., "unsafe":...}`;

const SAFETY_PROMPT = `Is this photo safe to show publicly on a campus lost-and-found site?
Unsafe means nudity, sexual content, violence, gore or hateful symbols. Shape: {"unsafe": true | false}`;

/**
 * The AI reads the photo and drafts the listing in one call. Where the region
 * offers Rekognition, its labels and moderation are layered on top.
 */
export class AiImageAnalyzer implements ImageAnalyzer {
  private readonly rekognition?: RekognitionClient;

  constructor(
    private readonly model: JsonModel,
    rekognitionConfig?: RekognitionClientConfig,
  ) {
    if (rekognitionConfig) this.rekognition = new RekognitionClient(rekognitionConfig);
  }

  private read(bytes: Uint8Array) {
    return this.model.json<Reading>(
      READ_PROMPT,
      [{ image: bytes }, { text: "Read this found item." }],
      400,
    );
  }

  private async rekognitionLabels(bytes: Uint8Array) {
    if (!this.rekognition) return undefined;
    const result = await this.rekognition.send(
      new DetectLabelsCommand({ Image: { Bytes: bytes }, MaxLabels: 10, MinConfidence: 70 }),
    );
    return (result.Labels ?? []).map((l) => l.Name ?? "").filter(Boolean);
  }

  async isUnsafe(bytes: Uint8Array) {
    try {
      if (this.rekognition) {
        const result = await this.rekognition.send(
          new DetectModerationLabelsCommand({ Image: { Bytes: bytes }, MinConfidence: 80 }),
        );
        return (result.ModerationLabels ?? []).length > 0;
      }
      const { unsafe } = await this.model.json<{ unsafe: boolean }>(
        SAFETY_PROMPT,
        [{ image: await forModel(bytes) }, { text: "Check this photo." }],
        20,
      );
      return unsafe === true;
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

    const [ai, extraLabels] = await Promise.all([
      settle(
        forModel(bytes).then((small) => this.read(small)),
        "read",
      ),
      settle(this.rekognitionLabels(bytes), "labels"),
    ]);

    const category = (CATEGORIES as readonly string[]).includes(ai?.category ?? "")
      ? (ai!.category as Category)
      : undefined;
    const matric =
      category === "id-card"
        ? MATRIC.exec(ai?.matric ?? "")?.[0]
            .replace(/\s/g, "")
            .toUpperCase()
        : undefined;
    const labels = [...new Set([...(extraLabels ?? []), ...(ai?.labels ?? [])])].slice(0, 8);

    return {
      labels,
      category,
      colour: ai?.colour && COLOURS.includes(ai.colour) ? ai.colour : undefined,
      brand: ai?.brand ?? undefined,
      title: ai?.title?.slice(0, 60),
      description: ai?.description?.slice(0, 280),
      question: ai?.question?.slice(0, 120),
      matric,
      unsafe: ai?.unsafe === true,
    };
  }
}
