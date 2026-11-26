import { describe, expect, it } from "vitest";
import { rankMatches, scoreCandidate } from "@/core/domain/matching";
import { buildCatalogue } from "@/infra/mock/catalogue";
import { KeywordReportParser } from "@/infra/mock/keyword-report-parser";

const parser = new KeywordReportParser();
const catalogue = buildCatalogue(Date.parse("2026-11-26T12:00:00Z"));
const byId = (id: string) => catalogue.find((item) => item.id === id)!;

describe("scoreCandidate", () => {
  it("scores an exact category, brand and colour in the same zone as a strong match", async () => {
    const report = await parser.parse("I lost my black HP laptop in Reading Room 2 last night.");
    expect(scoreCandidate(report, byId("itm_hp01"))).toBe(0.92);
  });

  it("drops sharply when the brand and place disagree", async () => {
    const report = await parser.parse("I lost my black HP laptop in Reading Room 2 last night.");
    expect(scoreCandidate(report, byId("itm_dl02"))).toBe(0.6);
  });

  it("gives related categories partial credit", async () => {
    const report = await parser.parse("lost my laptop somewhere");
    expect(scoreCandidate(report, byId("itm_sl03"))).toBeCloseTo(0.23, 2);
  });
});

describe("rankMatches", () => {
  it("returns the best three candidates, strongest first", async () => {
    const report = await parser.parse("I lost my black HP laptop in Reading Room 2 last night.");
    const matches = rankMatches(report, catalogue);
    expect(matches.map((m) => m.item.id)).toEqual(["itm_hp01", "itm_dl02", expect.any(String)]);
    expect(matches[0]!.score).toBeGreaterThan(matches[1]!.score);
  });

  it("never returns claimed items", async () => {
    const report = await parser.parse("black HP laptop");
    const claimed = catalogue.map((item) => ({ ...item, status: "claimed" as const }));
    expect(rankMatches(report, claimed)).toEqual([]);
  });
});
