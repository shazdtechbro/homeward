import type { Claim, Notice } from "../domain/claim";
import type { Category, FoundItem } from "../domain/item";
import type { Listing } from "../domain/listing";
import type { LostReport } from "../domain/lost-report";
import type { Match } from "../domain/matching";
import type { User } from "../domain/user";

export interface ItemRepository {
  listOpen(filter?: { category?: Category }): Promise<FoundItem[]>;
  count(): Promise<number>;
}

/** Everything a finder logs. DynamoDB in production. */
export interface ListingRepository extends ItemRepository {
  listOpen(filter?: { category?: Category }): Promise<Listing[]>;
  create(listing: Listing): Promise<void>;
  get(id: string): Promise<Listing | undefined>;
  recent(limit: number): Promise<Listing[]>;
  byFinder(userId: string): Promise<Listing[]>;
  markReturned(id: string, returnedTo: string): Promise<void>;
}

export interface UserRepository {
  create(user: User): Promise<void>;
  get(id: string): Promise<User | undefined>;
  byEmail(email: string): Promise<User | undefined>;
  byMatric(matric: string): Promise<User | undefined>;
  addKarma(id: string, points: number): Promise<void>;
}

export interface ClaimRepository {
  create(claim: Claim): Promise<void>;
  forItem(itemId: string): Promise<Claim[]>;
  byClaimant(userId: string): Promise<Claim[]>;
  addNotice(notice: Notice): Promise<void>;
  notices(userId: string): Promise<Notice[]>;
}

/** Turns free text into structured fields (Bedrock in production). */
export interface ReportParser {
  parse(text: string): Promise<LostReport>;
}

export type MatchResult = { scanned: number; matches: Match[] };

export interface MatchService {
  findMatches(report: LostReport): Promise<MatchResult>;
}

/**
 * What the camera saw: Rekognition labels, text and safety checks, plus a
 * Nova-written draft of the listing. Every field is a suggestion the finder confirms.
 */
export type ImageAnalysis = {
  labels: string[];
  category?: Category;
  colour?: string;
  brand?: string;
  title?: string;
  description?: string;
  /** A question only the real owner could answer, about something not in the photo. */
  question?: string;
  /** A matric number read off an ID card, for private matching. */
  matric?: string;
  /** Rekognition flagged the photo as unsafe; it must not be published. */
  unsafe?: boolean;
};

export interface ImageAnalyzer {
  analyze(image: Uint8Array): Promise<ImageAnalysis>;
  /** Server-side safety check before a photo is published. True means reject. */
  isUnsafe(image: Uint8Array): Promise<boolean>;
}

/** Text → vector for meaning-based search. Titan Text Embeddings V2 in production. */
export interface Embedder {
  embed(text: string): Promise<number[] | undefined>;
}

/**
 * Decides whether an owner's answer means the same as the finder's, beyond
 * exact words ("Super Eagles sticker" vs "green football sticker"). Nova in production.
 */
export interface AnswerJudge {
  sameMeaning(question: string, expected: string, given: string): Promise<boolean | undefined>;
}

/** Photos of found items. A private S3 bucket in production, streamed through our API. */
export interface PhotoStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | undefined>;
}
