import "server-only";
import { requiresPrivateMatch } from "@/core/domain/item";
import type { LostReport } from "@/core/domain/lost-report";
import type { Services } from "@/infra/container";
import { foundAtLabel } from "@/lib/time";
import type { ParsedField, SearchResponse } from "../schema";

const CATEGORY_LABELS: Record<string, string> = {
  "id-card": "ID card",
  "laptop-sleeve": "Laptop sleeve",
  "power-bank": "Power bank",
};

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function toFields(report: LostReport): ParsedField[] {
  const fields: Array<ParsedField | undefined> = [
    report.category && {
      label: "Category",
      value: CATEGORY_LABELS[report.category.value] ?? capitalise(report.category.value),
      evidence: report.category.evidence,
    },
    report.colour && {
      label: "Colour",
      value: capitalise(report.colour.value),
      evidence: report.colour.evidence,
    },
    report.brand && { label: "Brand", value: report.brand.value, evidence: report.brand.evidence },
    report.place && {
      label: "Place",
      value: report.place.value.name,
      evidence: report.place.evidence,
    },
    report.when && {
      label: "When",
      value: capitalise(report.when.value),
      evidence: report.when.evidence,
    },
  ];
  return fields.filter((field): field is ParsedField => field !== undefined);
}

export async function searchLostItem(text: string, services: Services): Promise<SearchResponse> {
  const report = await services.reportParser.parse(text);
  const fields = toFields(report);

  if (requiresPrivateMatch(report.category?.value)) {
    const scanned = await services.items.count();
    return { fields, scanned, outcome: { kind: "private" } };
  }

  const { scanned, matches } = await services.matcher.findMatches(report);
  if (matches.length === 0) return { fields, scanned, outcome: { kind: "none" } };

  return {
    fields,
    scanned,
    outcome: {
      kind: "matches",
      matches: matches.map(({ item, score }) => ({
        id: item.id,
        title: item.title,
        place: item.place.name,
        when: foundAtLabel(item.foundAt),
        score: Math.round(score * 100),
        imageKey: item.imageKey,
        readyAtSpot: item.status === "ready-at-spot",
      })),
    },
  };
}
