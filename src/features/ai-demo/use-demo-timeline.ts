"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PHASE_HOLD, type Phase, type Scene } from "./scene";
import type { SearchResponse } from "./schema";

type TimelineState = { phase: Phase; typed: string; result: SearchResponse | null };

type Options = {
  scene: Scene;
  playing: boolean;
  onDone: () => void;
  onError: (message: string) => void;
};

class Aborted extends Error {}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Aborted());
    });
  });
}

const INITIAL: TimelineState = { phase: "typing", typed: "", result: null };

/**
 * Drives one scene through typing → understanding → scanning → results → verified.
 * Pauses (and restarts the scene) whenever `playing` goes false, e.g. off-screen.
 * With reduced motion it lands on the finished state instantly and stays there.
 */
export function useDemoTimeline({ scene, playing, onDone, onError }: Options): TimelineState {
  const reduce = useReducedMotion();
  const [state, setState] = useState<TimelineState>(INITIAL);

  useEffect(() => {
    if (!playing) return;
    const controller = new AbortController();
    const { signal } = controller;

    async function run() {
      if (reduce) {
        const result = await scene.result;
        if (!signal.aborted) setState({ phase: "verified", typed: scene.query, result });
        return;
      }

      setState(INITIAL);
      for (let i = 1; i <= scene.query.length; i++) {
        await sleep(scene.typingSpeed * (scene.query[i - 1] === " " ? 1.6 : 1), signal);
        setState((s) => ({ ...s, typed: scene.query.slice(0, i) }));
      }

      const result = await scene.result;
      if (signal.aborted) return;
      await sleep(350, signal);

      for (const phase of ["understanding", "scanning", "results", "verified"] as const) {
        if (phase === "verified" && result.outcome.kind === "none") break;
        setState({ phase, typed: scene.query, result });
        await sleep(PHASE_HOLD[phase], signal);
      }
      onDone();
    }

    run().catch((error: unknown) => {
      if (error instanceof Aborted || signal.aborted) return;
      setState(INITIAL);
      onError(error instanceof Error ? error.message : "Something went wrong.");
    });

    return () => controller.abort();
    // The scene object identity is the trigger; callbacks are read fresh each run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, playing, reduce]);

  return state;
}
