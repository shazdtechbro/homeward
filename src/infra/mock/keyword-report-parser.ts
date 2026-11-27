import type { Category } from "@/core/domain/item";
import type { Extracted, LostReport } from "@/core/domain/lost-report";
import type { ReportParser } from "@/core/ports";
import { PLACE_ALIASES } from "@/core/domain/campus-places";

const CATEGORY_WORDS: Array<[string, Category]> = [
  ["laptop sleeve", "laptop-sleeve"],
  ["sleeve", "laptop-sleeve"],
  // "laptop bag" is a bag, so the bag phrases must win over plain "laptop".
  ["laptop bag", "bag"],
  ["laptop backpack", "bag"],
  ["school bag", "bag"],
  ["macbook", "laptop"],
  ["laptop", "laptop"],
  ["student id", "id-card"],
  ["id card", "id-card"],
  ["airpods", "earbuds"],
  ["earbuds", "earbuds"],
  ["iphone", "phone"],
  ["phone", "phone"],
  ["keys", "keys"],
  ["key", "keys"],
  ["backpack", "bag"],
  ["bag", "bag"],
  ["calculator", "calculator"],
  ["charger", "charger"],
  ["power bank", "power-bank"],
  ["powerbank", "power-bank"],
  ["glasses", "glasses"],
  ["specs", "glasses"],
  ["notebook", "notebook"],
  ["scarf", "scarf"],
  ["hijab", "scarf"],
  ["umbrella", "umbrella"],
  ["bottle", "bottle"],
  ["watch", "watch"],
];

const COLOURS: Array<[string, string]> = [
  ["black", "black"],
  ["white", "white"],
  ["grey", "grey"],
  ["gray", "grey"],
  ["silver", "silver"],
  ["blue", "blue"],
  ["navy", "blue"],
  ["green", "green"],
  ["red", "red"],
  ["orange", "orange"],
  ["brown", "brown"],
  ["pink", "pink"],
];

const BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Apple",
  "Samsung",
  "Tecno",
  "Infinix",
  "Casio",
  "Oraimo",
  "Anker",
];
const WHEN = ["last night", "this morning", "yesterday", "today", "tonight", "last week"];

const escape = (phrase: string) =>
  phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

/** Levenshtein distance, giving up once it passes `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j]! + 1,
        row[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    if (Math.min(...row) > max) return max + 1;
    prev = row;
  }
  return prev[b.length]!;
}

/** Typos allowed for a phrase: none for short words, one or two for longer ones. */
const tolerance = (phrase: string) => (phrase.length >= 8 ? 2 : phrase.length >= 4 ? 1 : 0);

/** Runs of consecutive words, as many as the phrase has, spelled exactly as written. */
function* windows(text: string, size: number) {
  const words = [...text.matchAll(/[a-z0-9']+/gi)].map((m) => m[0]);
  for (let i = 0; i + size <= words.length; i++) yield words.slice(i, i + size).join(" ");
}

/**
 * First phrase present as whole words, with the words exactly as the person
 * wrote them. Exact matches win; otherwise near-misses ("navvy", "calculater")
 * are accepted within a small typo tolerance.
 */
function near(text: string, phrase: string): string | undefined {
  const max = tolerance(phrase);
  if (max === 0) return undefined;
  const size = phrase.split(/\s+/).length;
  for (const candidate of windows(text, size)) {
    if (distance(candidate.toLowerCase(), phrase.toLowerCase(), max) <= max) return candidate;
  }
  return undefined;
}

function find<T>(
  text: string,
  phrases: Array<[string, T]>,
  { fuzzy = true } = {},
): Extracted<T> | undefined {
  // Phrases are ordered most specific first, so a misspelt "laptop backpak"
  // must still beat an exact "laptop": multi-word phrases try fuzzy in this pass.
  for (const [phrase, value] of phrases) {
    const match = new RegExp(`\\b${escape(phrase)}\\b`, "i").exec(text);
    if (match) return { value, evidence: match[0] };
    const multiWord = phrase.includes(" ");
    const candidate = fuzzy && multiWord ? near(text, phrase) : undefined;
    if (candidate) return { value, evidence: candidate };
  }
  if (!fuzzy) return undefined;
  for (const [phrase, value] of phrases) {
    const candidate = near(text, phrase);
    if (candidate) return { value, evidence: candidate };
  }
  return undefined;
}

/**
 * Deterministic stand-in for the Bedrock parser. Good enough for the landing
 * demo and tests, and it fills exactly the same LostReport shape.
 */
export class KeywordReportParser implements ReportParser {
  async parse(text: string): Promise<LostReport> {
    const daysAgo = /\b(\d+)\s+days?\s+ago\b/i.exec(text);
    return {
      text,
      category: find(text, CATEGORY_WORDS),
      colour: find(text, COLOURS),
      // Brand names are too short and distinct to guess at: exact matches only.
      brand: find(
        text,
        BRANDS.map((brand) => [brand, brand]),
        { fuzzy: false },
      ),
      place: find(text, PLACE_ALIASES),
      when: daysAgo
        ? { value: daysAgo[0].toLowerCase(), evidence: daysAgo[0] }
        : find(
            text,
            WHEN.map((when) => [when, when]),
          ),
    };
  }
}
