import type { SearchResponse } from "./schema";

/** One run of the demo: what the person types and what Homeward answers. */
export type Scene = {
  id: string;
  query: string;
  /** May still be in flight while the query types out. */
  result: Promise<SearchResponse>;
  pickupCode: string;
  /** Milliseconds per typed character. */
  typingSpeed: number;
};

export const PHASES = ["typing", "understanding", "scanning", "results", "verified"] as const;
export type Phase = (typeof PHASES)[number];

export const reached = (phase: Phase, target: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(target);

/** How long each phase holds before moving on, in ms. */
export const PHASE_HOLD: Record<Exclude<Phase, "typing">, number> = {
  understanding: 1900,
  scanning: 3000,
  results: 2800,
  verified: 3000,
};
