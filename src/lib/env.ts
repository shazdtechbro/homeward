import "server-only";
import { z } from "zod";

const DEV_SECRET = "dev-only-secret-change-me-dev-only-secret";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** "mock" keeps everything in this process; "aws" uses DynamoDB, S3 and Rekognition. */
    HOMEWARD_ADAPTERS: z.enum(["mock", "aws"]).default("mock"),
    /** New AWS "project" accounts are pinned to one home region; ours is Stockholm. */
    HOMEWARD_REGION: z.string().default("eu-north-1"),
    HOMEWARD_TABLE: z.string().default("homeward"),
    HOMEWARD_BUCKET: z.string().optional(),
    HOMEWARD_ACCESS_KEY_ID: z.string().optional(),
    HOMEWARD_SECRET_ACCESS_KEY: z.string().optional(),
    /** Amazon Nova 2 Lite through the EU cross-region inference profile. */
    HOMEWARD_TEXT_MODEL: z.string().default("eu.amazon.nova-2-lite-v1:0"),
    /** Optional: Titan embeddings for meaning-based search, where the region offers them. */
    HOMEWARD_EMBED_MODEL: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    /** Optional: a region with Rekognition. Without it, Nova reads the photos on its own. */
    HOMEWARD_REKOGNITION_REGION: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    /**
     * Optional secondary AI provider (any OpenAI-compatible API). Bedrock is tried
     * first; this answers whenever Bedrock is unavailable.
     */
    HOMEWARD_AI_BASE_URL: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    HOMEWARD_AI_API_KEY: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    HOMEWARD_AI_TEXT_MODEL: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    HOMEWARD_AI_VISION_MODEL: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    /** Signs session cookies. At least 32 characters. */
    HOMEWARD_SESSION_SECRET: z.string().min(32).default(DEV_SECRET),
  })
  .refine((e) => e.HOMEWARD_ADAPTERS !== "aws" || e.HOMEWARD_BUCKET, {
    message: "HOMEWARD_BUCKET is required when HOMEWARD_ADAPTERS=aws",
    path: ["HOMEWARD_BUCKET"],
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
  );
}

if (parsed.data.HOMEWARD_ADAPTERS === "aws" && parsed.data.HOMEWARD_SESSION_SECRET === DEV_SECRET) {
  console.warn(
    "HOMEWARD_SESSION_SECRET is the development default. Set a real one before going live.",
  );
}

export const env = parsed.data;
