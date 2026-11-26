import type { Category } from "@/core/domain/item";
import type { Extracted, LostReport } from "@/core/domain/lost-report";
import type { ReportParser } from "@/core/ports";
import { PLACE_ALIASES } from "./campus-places";

const CATEGORY_WORDS: Array<[string, Category]> = [
  ["laptop sleeve", "laptop-sleeve"],
  ["sleeve", "laptop-sleeve"],
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

const BRANDS = ["HP", "Dell", "Lenovo", "Apple", "Samsung", "Tecno", "Infinix", "Casio", "Oraimo", "Anker"];
const WHEN = ["last night", "this morning", "yesterday", "today", "tonight", "last week"];

const escape = (phrase: string) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

/** First phrase present as whole words, with the words exactly as the person wrote them. */
function find<T>(text: string, phrases: Array<[string, T]>): Extracted<T> | undefined {
  for (const [phrase, value] of phrases) {
    const match = new RegExp(`\\b${escape(phrase)}\\b`, "i").exec(text);
    if (match) return { value, evidence: match[0] };
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
      brand: find(text, BRANDS.map((brand) => [brand, brand])),
      place: find(text, PLACE_ALIASES),
      when: daysAgo
        ? { value: daysAgo[0].toLowerCase(), evidence: daysAgo[0] }
        : find(text, WHEN.map((when) => [when, when])),
    };
  }
}
