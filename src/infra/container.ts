import "server-only";
import type {
  AnswerJudge,
  ClaimRepository,
  Embedder,
  ImageAnalyzer,
  ListingRepository,
  MatchService,
  PhotoStorage,
  ReportParser,
  UserRepository,
} from "@/core/ports";
import { env } from "@/lib/env";
import { awsClientConfig } from "./aws/config";
import {
  DynamoClaimRepository,
  DynamoListingRepository,
  DynamoTable,
  DynamoUserRepository,
} from "./aws/dynamo-store";
import { AiAnswerJudge } from "./ai/answer-judge";
import { AiImageAnalyzer } from "./ai/image-analyzer";
import { FailoverModel, type JsonModel } from "./ai/model";
import { OpenAiCompatibleModel } from "./ai/openai-compatible";
import { AiReportParser } from "./ai/report-parser";
import { Bedrock, TitanEmbedder } from "./aws/bedrock";
import { S3PhotoStorage } from "./aws/s3-photo-storage";
import { withDemoSeeds } from "./demo-seeds";
import { HybridMatchService } from "./mock/in-memory-match-service";
import { KeywordReportParser } from "./mock/keyword-report-parser";
import {
  MemoryClaimRepository,
  MemoryListingRepository,
  MemoryPhotoStorage,
  MemoryUserRepository,
} from "./mock/memory-store";
import { NoOpImageAnalyzer } from "./mock/no-op-image-analyzer";

export type Services = {
  items: ListingRepository;
  users: UserRepository;
  claims: ClaimRepository;
  photos: PhotoStorage;
  vision: ImageAnalyzer;
  reportParser: ReportParser;
  matcher: MatchService;
  /** Optional: without them, search is field-based and answers are checked by words. */
  embedder?: Embedder;
  judge?: AnswerJudge;
};

type Parts = Omit<Services, "items" | "matcher"> & { listings: ListingRepository };

function assemble({ listings, ...parts }: Parts): Services {
  const items = withDemoSeeds(listings);
  return { ...parts, items, matcher: new HybridMatchService(items, parts.embedder) };
}

/** The secondary AI provider, when one is configured. */
function secondaryModel(): JsonModel | undefined {
  const { HOMEWARD_AI_BASE_URL: baseUrl, HOMEWARD_AI_API_KEY: apiKey } = env;
  const textModel = env.HOMEWARD_AI_TEXT_MODEL;
  if (!baseUrl || !apiKey || !textModel) return undefined;
  return new OpenAiCompatibleModel({
    baseUrl,
    apiKey,
    textModel,
    visionModel: env.HOMEWARD_AI_VISION_MODEL ?? textModel,
  });
}

function aiServices(model: JsonModel | undefined, rekognition?: { region: string }) {
  const keywords = new KeywordReportParser();
  if (!model) return { reportParser: keywords, vision: new NoOpImageAnalyzer() };
  return {
    reportParser: new AiReportParser(model, keywords),
    vision: new AiImageAnalyzer(model, rekognition),
    judge: new AiAnswerJudge(model),
  };
}

function createMockServices(): Services {
  return assemble({
    listings: new MemoryListingRepository(),
    users: new MemoryUserRepository(),
    claims: new MemoryClaimRepository(),
    photos: new MemoryPhotoStorage(),
    ...aiServices(secondaryModel()),
  });
}

function createAwsServices(): Services {
  const config = awsClientConfig();
  const table = new DynamoTable(config, env.HOMEWARD_TABLE);
  const bedrock = new Bedrock(config, env.HOMEWARD_TEXT_MODEL, env.HOMEWARD_EMBED_MODEL ?? "");
  const rekognition = env.HOMEWARD_REKOGNITION_REGION
    ? { ...config, region: env.HOMEWARD_REKOGNITION_REGION }
    : undefined;
  const secondary = secondaryModel();
  const model: JsonModel = secondary ? new FailoverModel(bedrock, secondary) : bedrock;
  return assemble({
    listings: new DynamoListingRepository(table),
    users: new DynamoUserRepository(table),
    claims: new DynamoClaimRepository(table),
    photos: new S3PhotoStorage(config, env.HOMEWARD_BUCKET!),
    ...aiServices(model, rekognition),
    embedder: env.HOMEWARD_EMBED_MODEL ? new TitanEmbedder(bedrock) : undefined,
  });
}

const factories: Record<typeof env.HOMEWARD_ADAPTERS, () => Services> = {
  mock: createMockServices,
  aws: createAwsServices,
};

let services: Services | undefined;

/** The single composition root: every route gets its adapters from here. */
export function getServices(): Services {
  services ??= factories[env.HOMEWARD_ADAPTERS]();
  return services;
}
