import type { Category, FoundItem } from "../domain/item";
import type { LostReport } from "../domain/lost-report";
import type { Match } from "../domain/matching";

export interface ItemRepository {
  listOpen(filter?: { category?: Category }): Promise<FoundItem[]>;
  count(): Promise<number>;
}

/** Turns free text into structured fields (Bedrock Nova in production). */
export interface ReportParser {
  parse(text: string): Promise<LostReport>;
}

export type MatchResult = { scanned: number; matches: Match[] };

/** Finds candidate items for a report (Titan embeddings + S3 Vectors in production). */
export interface MatchService {
  findMatches(report: LostReport): Promise<MatchResult>;
}

export type ImageAnalysis = { labels: string[]; hasFace: boolean; detectedText: string[] };

/** Rekognition + Textract: labels, faces to blur, and text such as matric numbers. */
export interface ImageAnalyzer {
  analyze(objectKey: string): Promise<ImageAnalysis>;
}

export interface Notifier {
  sendPrivateMatch(to: { email: string }, itemId: string): Promise<void>;
}

export interface Storage {
  presignUpload(contentType: string): Promise<{ url: string; objectKey: string }>;
}
