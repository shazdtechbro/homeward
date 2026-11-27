import "server-only";
import {
  DetectLabelsCommand,
  DetectModerationLabelsCommand,
  RekognitionClient,
  type RekognitionClientConfig,
} from "@aws-sdk/client-rekognition";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { CATEGORIES, type Category } from "@/core/domain/item";
import type { ImageAnalysis, ImageAnalyzer } from "@/core/ports";
import { logger } from "@/lib/logger";
import type { JsonModel } from "./model";

/**
 * Vision models bill by image size and free tiers cap tokens per minute, so the
 * model gets a 640px copy: enough to read labels and brands reliably.
 */
async function forModel(bytes: Uint8Array): Promise<Uint8Array> {
  const small = await sharp(bytes)
    .rotate()
    .resize(640, 640, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
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

const READ_PROMPT = `Draft a campus lost-and-found listing from this photo of a found item. JSON fields:
labels: up to 5 short nouns seen; title: 2-5 words like "Black HP laptop";
category: exactly one of ${CATEGORIES.join("|")} (use other if none fit);
colour: exactly one of ${COLOURS.join("|")}; brand: if visible, else null;
description: one neutral sentence, no names or numbers read off the item;
question: something only the owner would know that is NOT visible here;
matric: matric number like 19/52HA041 if it is a student ID card, else null;
unsafe: true only for nudity, violence or gore.`;

const SAFETY_PROMPT = `Is this photo safe to show publicly on a campus lost-and-found site?
Unsafe means nudity, sexual content, violence, gore or hateful symbols. Shape: {"unsafe": true | false}`;

/**
 * The AI reads the photo and drafts the listing in one call. Where the region
 * offers Rekognition, its labels and moderation are layered on top.
 */
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export class AiImageAnalyzer implements ImageAnalyzer {
  /**
   * The safety verdict from the analysis a finder already ran, keyed by photo
   * hash, so posting the same photo doesn't spend a second vision call.
   */
  private readonly verdicts = new Map<string, boolean>();

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
    const known = this.verdicts.get(hash(bytes));
    if (known !== undefined) return known;
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

  private remember(bytes: Uint8Array, unsafe: boolean, known: boolean) {
    if (known) {
      if (this.verdicts.size > 500) this.verdicts.clear();
      this.verdicts.set(hash(bytes), unsafe);
    }
    return unsafe;
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
      unsafe: this.remember(bytes, ai?.unsafe === true, Boolean(ai)),
    };
  }
}
