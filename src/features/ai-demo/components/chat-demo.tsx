"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { GlassCard } from "@/ui/glass-card";
import { useScrollTo } from "@/ui/smooth-scroll";
import { reached, type Phase, type Scene } from "../scene";
import { scriptedScene } from "../scripted-scenes";
import { randomPickupCode, searchLostItem } from "../search-client";
import { useDemoTimeline } from "../use-demo-timeline";
import { ParsedFields } from "./parsed-fields";
import { ResultStage } from "./result-stage";
import { ScanStage } from "./scan-stage";
import { TryItForm } from "./try-it-form";
import { UserMessage } from "./user-message";

const STATUS: Record<Phase, string> = {
  typing: "Listening",
  understanding: "Understanding",
  scanning: "Searching campus",
  results: "Matches found",
  verified: "Verified",
};

export function ChatDemo() {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { amount: 0.4 });
  const scrollTo = useScrollTo();

  const [scene, setScene] = useState<Scene>(() => scriptedScene(0));
  const [userDriven, setUserDriven] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advance = useCallback(() => {
    if (userDriven) return;
    setScene((current) => scriptedScene(current.id === "laptop" ? 1 : 0));
  }, [userDriven]);

  const { phase, typed, result } = useDemoTimeline({
    scene,
    playing: inView,
    onDone: advance,
    onError: setError,
  });

  function runUserSearch(text: string) {
    setError(null);
    setUserDriven(true);
    setScene({
      id: `user-${Date.now()}`,
      query: text,
      result: searchLostItem(text),
      pickupCode: randomPickupCode(),
      typingSpeed: 16,
    });
    if (cardRef.current) scrollTo(cardRef.current, -110);
  }

  function replayDemo() {
    setUserDriven(false);
    setScene(scriptedScene(0));
  }

  const understood = reached(phase, "understanding") && result;
  const evidence = understood ? result.fields.map((field) => field.evidence) : [];

  return (
    <div className="mx-auto max-w-[1000px]">
      <GlassCard
        ref={cardRef}
        className="relative flex h-[780px] flex-col overflow-hidden p-4 sm:h-[660px] sm:p-8"
      >
        <header className="flex items-center justify-between border-b border-ink/8 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
              <span className="relative size-2.5 rounded-full bg-success" />
            </span>
            <span className="text-[15px] font-semibold">Homeward AI</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-[12px] tracking-wide text-ink-2 uppercase"
            >
              {STATUS[phase]}
            </motion.span>
          </AnimatePresence>
        </header>

        <div className="mt-5 flex flex-col gap-5" aria-hidden={!userDriven}>
          <UserMessage typed={typed} evidence={evidence} typing={phase === "typing"} />
          <div className="min-h-[96px] sm:min-h-[76px]">
            {understood && <ParsedFields key={scene.id} fields={result.fields} />}
          </div>
        </div>

        <div className="relative mt-3 flex-1" aria-hidden={!userDriven}>
          <AnimatePresence mode="wait">
            {phase === "scanning" && result && (
              <motion.div
                key={`scan-${scene.id}`}
                className="absolute inset-0"
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
              >
                <ScanStage scanned={result.scanned} />
              </motion.div>
            )}
            {reached(phase, "results") && result && (
              <motion.div
                key={`results-${scene.id}`}
                className="absolute inset-0"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultStage
                  outcome={result.outcome}
                  verified={phase === "verified"}
                  pickupCode={scene.pickupCode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      <p className="sr-only" aria-live="polite">
        {userDriven && result && reached(phase, "results") ? describe(result) : ""}
      </p>

      <TryItForm
        onSearch={runUserSearch}
        error={error}
        onReplay={userDriven ? replayDemo : undefined}
      />
    </div>
  );
}

function describe(result: NonNullable<ReturnType<typeof useDemoTimeline>["result"]>) {
  const { outcome } = result;
  if (outcome.kind === "private")
    return "This looks like an ID card. Matric Match will email the owner privately.";
  if (outcome.kind === "none") return "No matches yet.";
  return `${outcome.matches.length} possible matches. Best: ${outcome.matches[0]!.title}, ${outcome.matches[0]!.score}% match.`;
}
