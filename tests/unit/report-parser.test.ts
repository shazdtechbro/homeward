import { describe, expect, it } from "vitest";
import { KeywordReportParser } from "@/infra/mock/keyword-report-parser";

const parser = new KeywordReportParser();

describe("KeywordReportParser", () => {
  it("extracts every field with the words that justified it", async () => {
    const report = await parser.parse("I lost my black HP laptop in Reading Room 2 last night.");
    expect(report.category).toEqual({ value: "laptop", evidence: "laptop" });
    expect(report.colour).toEqual({ value: "black", evidence: "black" });
    expect(report.brand).toEqual({ value: "HP", evidence: "HP" });
    expect(report.place?.value.name).toBe("Reading Room 2");
    expect(report.when?.value).toBe("last night");
  });

  it("normalises colour synonyms and relative days", async () => {
    const report = await parser.parse("navy backpack near the SUB 3 days ago");
    expect(report.colour?.value).toBe("blue");
    expect(report.category?.value).toBe("bag");
    expect(report.when?.value).toBe("3 days ago");
  });

  it("does not match brands inside other words", async () => {
    const report = await parser.parse("my phone fell near the shop");
    expect(report.brand).toBeUndefined();
  });
});

describe("bag phrases", () => {
  it("reads a laptop bag as a bag, not a laptop", async () => {
    const report = await new KeywordReportParser().parse(
      "I lost my navy laptop bag at engineering",
    );
    expect(report.category?.value).toBe("bag");
  });
});

describe("typos", () => {
  it("still understands misspelt colours and items", async () => {
    const report = await new KeywordReportParser().parse("navvy laptop backpak at engineerng");
    expect(report.colour?.value).toBe("blue");
    expect(report.category?.value).toBe("bag");
    expect(report.place?.value.name).toBe("Faculty of Engineering");
  });

  it("does not invent matches from unrelated words", async () => {
    const report = await new KeywordReportParser().parse("I lost it near the gate");
    expect(report.category).toBeUndefined();
    expect(report.colour).toBeUndefined();
  });
});
