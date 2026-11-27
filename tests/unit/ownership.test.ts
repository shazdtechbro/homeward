import { describe, expect, it } from "vitest";
import { answerMatches } from "@/core/domain/listing";
import { cosine, rankMatches } from "@/core/domain/matching";
import { normaliseMatric } from "@/core/domain/user";
import { buildCatalogue } from "@/infra/mock/catalogue";

describe("answerMatches", () => {
  it("accepts the same substance in different words", () => {
    expect(answerMatches("green super eagles sticker", "A green Super Eagles one, peeling")).toBe(true);
  });

  it("rejects vague answers", () => {
    expect(answerMatches("green super eagles sticker", "it has a sticker")).toBe(false);
    expect(answerMatches("small red bottle opener", "blue")).toBe(false);
  });

  it("supports a looser threshold for the AI gate", () => {
    expect(answerMatches("green super eagles sticker", "a green football sticker", 0.25)).toBe(true);
  });
});

describe("matric numbers", () => {
  it("compare without slashes or case", () => {
    expect(normaliseMatric("19/52ha041")).toBe(normaliseMatric("1952HA041"));
  });
});

describe("semantic blend", () => {
  it("cosine is 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });

  it("lets meaning lift an item the keywords missed", () => {
    const items = buildCatalogue();
    const report = { text: "my specs" };
    const glasses = items.find((i) => i.category === "glasses")!;
    const withoutAi = rankMatches(report, items);
    const withAi = rankMatches(report, items, 3, 0.25, (i) => (i.id === glasses.id ? 0.95 : 0.1));
    expect(withoutAi).toHaveLength(0);
    expect(withAi[0]?.item.id).toBe(glasses.id);
  });
});

describe("pickup codes", () => {
  it("are always four digits", async () => {
    const { newPickupCode } = await import("@/core/domain/claim");
    for (let i = 0; i < 200; i++) expect(newPickupCode()).toMatch(/^\d{4}$/);
  });
});
