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
import { DynamoClaimRepository, DynamoListingRepository, DynamoTable, DynamoUserRepository } from "./aws/dynamo-store";
import { Bedrock, NovaAnswerJudge, NovaReportParser, TitanEmbedder } from "./aws/bedrock";
import { AwsImageAnalyzer } from "./aws/image-analyzer";
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

function createMockServices(): Services {
  return assemble({
    listings: new MemoryListingRepository(),
    users: new MemoryUserRepository(),
    claims: new MemoryClaimRepository(),
    photos: new MemoryPhotoStorage(),
    vision: new NoOpImageAnalyzer(),
    reportParser: new KeywordReportParser(),
  });
}

function createAwsServices(): Services {
  const config = awsClientConfig();
  const table = new DynamoTable(config, env.HOMEWARD_TABLE);
  const bedrock = new Bedrock(config, env.HOMEWARD_TEXT_MODEL, env.HOMEWARD_EMBED_MODEL ?? "");
  const rekognition = env.HOMEWARD_REKOGNITION_REGION ? { ...config, region: env.HOMEWARD_REKOGNITION_REGION } : undefined;
  return assemble({
    listings: new DynamoListingRepository(table),
    users: new DynamoUserRepository(table),
    claims: new DynamoClaimRepository(table),
    photos: new S3PhotoStorage(config, env.HOMEWARD_BUCKET!),
    vision: new AwsImageAnalyzer(bedrock, rekognition),
    reportParser: new NovaReportParser(bedrock, new KeywordReportParser()),
    embedder: env.HOMEWARD_EMBED_MODEL ? new TitanEmbedder(bedrock) : undefined,
    judge: new NovaAnswerJudge(bedrock),
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
