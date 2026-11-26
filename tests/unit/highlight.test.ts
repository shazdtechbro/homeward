import { describe, expect, it } from "vitest";
import { splitByEvidence } from "@/features/ai-demo/highlight";

describe("splitByEvidence", () => {
  it("marks each evidence phrase once, in reading order", () => {
    expect(splitByEvidence("Lost my black HP laptop", ["laptop", "black"])).toEqual([
      { text: "Lost my ", highlighted: false },
      { text: "black", highlighted: true },
      { text: " HP ", highlighted: false },
      { text: "laptop", highlighted: true },
    ]);
  });

  it("ignores phrases that are not present yet, e.g. mid-typing", () => {
    expect(splitByEvidence("Lost my bla", ["black"])).toEqual([{ text: "Lost my bla", highlighted: false }]);
  });
});
