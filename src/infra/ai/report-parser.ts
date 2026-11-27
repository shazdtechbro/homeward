import "server-only";
import { PLACES } from "@/core/domain/campus-places";
import { CATEGORIES, type Category } from "@/core/domain/item";
import type { Extracted, LostReport } from "@/core/domain/lost-report";
import type { ReportParser } from "@/core/ports";
import { logger } from "@/lib/logger";
import type { JsonModel } from "./model";

const PLACE_NAMES = Object.values(PLACES).map((p) => p.name);

type Field<T = string> = { value: T; evidence: string } | null;
type Reading = {
  category: Field<Category>;
  colour: Field;
  brand: Field;
  place: Field;
  when: Field;
};

const PROMPT = `You read lost-item reports from students at the University of Ilorin, Nigeria.
Extract these fields. For each give {"value": ..., "evidence": "<the exact words from the report>"}, or null if not mentioned.
- category: one of ${CATEGORIES.join(", ")}. A "laptop bag" or "laptop backpack" is a bag.
- colour: one lowercase word from black, white, grey, silver, blue, green, red, orange, yellow, brown, pink, purple. Navy is blue.
- brand: as normally written (HP, Tecno, Infinix, Apple, Samsung, Casio, Oraimo...)
- place: the closest of ${PLACE_NAMES.join(", ")}. "Engineering" means Faculty of Engineering, "library" means Main Library, "SUB" means Student Union Building.
- when: a short phrase such as "last night" or "yesterday"
Students write Nigerian English and pidgin ("my phone don loss for library") and make typos. Understand them.
Shape: {"category":..., "colour":..., "brand":..., "place":..., "when":...}`;

/**
 * The AI reads the report the way a person would. A field is kept only if the
 * model quotes words that are really in the report; the keyword parser fills
 * any gaps and takes over completely if the model is unreachable.
 */
export class AiReportParser implements ReportParser {
  constructor(
    private readonly model: JsonModel,
    private readonly fallback: ReportParser,
  ) {}

  async parse(text: string): Promise<LostReport> {
    const basic = await this.fallback.parse(text);
    try {
      const ai = await this.model.json<Reading>(PROMPT, [{ text: `Report: """${text}"""` }], 300);
      const lower = text.toLowerCase();
      const grounded = <T>(
        field: Field<T> | undefined,
        valid: (v: T) => boolean,
      ): Extracted<T> | undefined => {
        if (!field || field.value == null || !valid(field.value)) return undefined;
        const evidence = typeof field.evidence === "string" ? field.evidence.trim() : "";
        return evidence && lower.includes(evidence.toLowerCase())
          ? { value: field.value, evidence }
          : undefined;
      };
      const place = grounded(ai.place, (v) => typeof v === "string");
      const knownPlace =
        place &&
        Object.values(PLACES).find(
          (p) => p.name.toLowerCase() === String(place.value).toLowerCase(),
        );

      return {
        text,
        category:
          grounded(ai.category, (v) => (CATEGORIES as readonly string[]).includes(v)) ??
          basic.category,
        colour: grounded(ai.colour, (v) => typeof v === "string") ?? basic.colour,
        brand: grounded(ai.brand, (v) => typeof v === "string") ?? basic.brand,
        place: knownPlace ? { value: knownPlace, evidence: place.evidence } : basic.place,
        when: grounded(ai.when, (v) => typeof v === "string") ?? basic.when,
      };
    } catch (error) {
      logger.warn("ai.parse_fallback", { message: String(error).slice(0, 200) });
      return basic;
    }
  }
}
