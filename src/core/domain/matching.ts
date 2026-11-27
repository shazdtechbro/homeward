import { placeProximity } from "./campus";
import type { Category, FoundItem } from "./item";
import type { LostReport } from "./lost-report";

export type Match = { item: FoundItem; score: number };

const WEIGHTS = { category: 0.45, brand: 0.2, colour: 0.15, place: 0.2 } as const;

/** Things people mix up or lose together, worth surfacing as weaker candidates. */
const RELATED: Partial<Record<Category, Category[]>> = {
  laptop: ["laptop-sleeve", "charger"],
  "laptop-sleeve": ["laptop"],
  phone: ["power-bank", "charger", "earbuds"],
  earbuds: ["phone"],
  bag: ["notebook"],
};

function categoryScore(wanted: Category | undefined, actual: Category) {
  if (!wanted) return 0;
  if (wanted === actual) return 1;
  return RELATED[wanted]?.includes(actual) ? 0.5 : 0;
}

const same = (a: string | undefined, b: string | undefined) =>
  a !== undefined && b !== undefined && a.toLowerCase() === b.toLowerCase();

/**
 * Field-level similarity between a lost report and a found item, 0–1.
 * Embedding search narrows the candidates; this re-ranks them explainably.
 */
export function scoreCandidate(report: LostReport, item: FoundItem): number {
  const score =
    WEIGHTS.category * categoryScore(report.category?.value, item.category) +
    WEIGHTS.brand * (same(report.brand?.value, item.brand) ? 1 : 0) +
    WEIGHTS.colour * (same(report.colour?.value, item.colour) ? 1 : 0) +
    WEIGHTS.place * placeProximity(report.place?.value, item.place);
  return Math.round(score * 100) / 100;
}

/** How much meaning-based similarity counts when it is available. */
export const SEMANTIC_WEIGHT = 0.35;

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Hybrid ranking: explainable field scores, blended with embedding similarity
 * when the caller can provide it, so "my specs" still finds "black-framed glasses".
 */
export function rankMatches(
  report: LostReport,
  items: FoundItem[],
  limit = 3,
  floor = 0.25,
  similarity?: (item: FoundItem) => number | undefined,
): Match[] {
  return (
    items
      .filter((item) => item.status !== "claimed")
      // Once the person has said what it is, other kinds of item aren't candidates,
      // however well the colour or place lines up.
      .filter((item) => !report.category || categoryScore(report.category.value, item.category) > 0)
      .map((item) => {
        const fields = scoreCandidate(report, item);
        const sim = similarity?.(item);
        const score =
          sim === undefined
            ? fields
            : // Similarity closes part of the gap to 1, so it can lift a score but never sink one.
              fields + SEMANTIC_WEIGHT * Math.max(0, sim) * (1 - fields);
        return { item, score: Math.round(score * 100) / 100 };
      })
      .filter((match) => match.score >= floor)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  );
}

const STOP = new Set([
  "i",
  "my",
  "a",
  "an",
  "the",
  "at",
  "in",
  "on",
  "near",
  "lost",
  "it",
  "is",
  "was",
  "of",
  "and",
  "for",
  "to",
  "don",
  "loss",
  "for",
]);
const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );

/**
 * Share of the item's title words that appear in the report: a cheap stand-in
 * for semantic similarity when no embedding model is available.
 */
export function titleOverlap(report: string, title: string): number {
  const wanted = words(title);
  if (wanted.size === 0) return 0;
  const said = words(report);
  let hits = 0;
  for (const w of wanted) if (said.has(w)) hits++;
  return hits / wanted.size;
}
