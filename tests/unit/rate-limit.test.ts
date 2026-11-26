import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit per window, then rejects until it resets", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    check("a", 0);
    check("a", 10);
    expect(() => check("a", 20)).toThrow(/Too many/);
    expect(() => check("a", 1001)).not.toThrow();
    expect(() => check("b", 20)).not.toThrow();
  });
});
