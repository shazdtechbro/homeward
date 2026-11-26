"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/ui/cn";
import { Picture, imageNameOr } from "@/ui/picture";
import type { MatchView, SearchResponse } from "../schema";
import { VerifiedToast } from "./verified-toast";

const cardMotion = (i: number) => ({
  initial: { opacity: 0, y: 28, scale: 0.92 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: i * 0.12 },
});

type ResultStageProps = { outcome: SearchResponse["outcome"]; verified: boolean; pickupCode: string };

export function ResultStage({ outcome, verified, pickupCode }: ResultStageProps) {
  if (outcome.kind === "private") return <PrivateMatch verified={verified} />;
  if (outcome.kind === "none") return <NoMatch />;

  return (
    <div className="flex h-full flex-col">
      <ul className="grid flex-1 content-start gap-2.5 sm:grid-cols-3 sm:gap-4">
        {outcome.matches.map((match, i) => (
          <motion.li key={match.id} {...cardMotion(i)}>
            <MatchCard match={match} best={i === 0} />
          </motion.li>
        ))}
      </ul>
      <motion.div {...cardMotion(outcome.matches.length)} className="mt-4 flex h-14 items-center justify-center sm:mt-5">
        <AnimatePresence mode="wait">
          {verified ? (
            <VerifiedToast key="toast" kind="pickup" pickupCode={pickupCode} />
          ) : (
            <motion.span
              key="cta"
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-coral px-6 text-[15px] font-semibold text-white shadow-coral"
            >
              This looks like mine → Prove it
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MatchCard({ match, best }: { match: MatchView; best: boolean }) {
  return (
    <article
      className={cn(
        "flex items-center gap-3.5 rounded-[18px] bg-white p-2.5 sm:block sm:p-3",
        best ? "shadow-coral ring-1 ring-coral/40" : "shadow-[0_10px_30px_rgba(20,20,18,0.07)]",
      )}
    >
      <div className="relative size-[68px] shrink-0 overflow-hidden rounded-[12px] bg-paper-2 sm:aspect-[4/3] sm:size-auto">
        <Picture
          name={imageNameOr(match.imageKey, "found-backpack")}
          alt={match.title}
          sizes="(min-width: 640px) 280px, 68px"
          className="block size-full"
          imgClassName="size-full object-cover"
        />
        <span
          className={cn(
            "absolute top-2 right-2 hidden rounded-full px-2.5 py-1 font-mono text-[13px] sm:block",
            best ? "bg-coral text-white" : "bg-white/90 text-ink",
          )}
        >
          {match.score}%
        </span>
      </div>
      <div className="min-w-0 flex-1 sm:mt-3 sm:px-1 sm:pb-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold">{match.title}</h3>
          <span className={cn("font-mono text-[14px] sm:hidden", best ? "text-coral" : "text-ink-2")}>
            {match.score}%
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[12px] text-ink-2">
          {match.place} · {match.when}
        </p>
        {match.readyAtSpot && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-success">
            <span className="size-1.5 rounded-full bg-success" /> Ready at Spot
          </p>
        )}
      </div>
    </article>
  );
}

function PrivateMatch({ verified }: { verified: boolean }) {
  return (
    <motion.div {...cardMotion(0)} className="flex h-full flex-col items-center justify-center gap-5">
      <article className="flex w-full max-w-[560px] flex-col items-center gap-5 rounded-[22px] bg-white p-5 shadow-soft sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[14px] sm:w-[220px]">
          <Picture
            name="match-idcard"
            alt="A student ID card, details hidden"
            sizes="220px"
            className="block size-full"
            imgClassName="size-full scale-110 object-cover blur-[10px]"
          />
          <span className="glass absolute inset-0 m-auto flex h-9 w-fit items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold">
            🔒 Details hidden
          </span>
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-[0.08em] text-green uppercase">Matric Match</p>
          <p className="font-display-tight mt-2 text-[28px]">We&rsquo;ve emailed you privately.</p>
          <p className="mt-2 text-[15px] text-ink-2">
            ID cards never appear in public results. Matched by matric no.{" "}
            <span className="font-mono text-ink">••/••/0421</span>
          </p>
        </div>
      </article>
      <div className="flex h-14 items-center">
        <AnimatePresence>{verified && <VerifiedToast kind="private" pickupCode="" />}</AnimatePresence>
      </div>
    </motion.div>
  );
}

function NoMatch() {
  return (
    <motion.div {...cardMotion(0)} className="flex h-full flex-col items-center justify-center text-center">
      <p className="font-display-tight text-[32px]">Not found yet.</p>
      <p className="mt-2 max-w-sm text-[15px] text-ink-2">
        We&rsquo;ll watch every new find for 30 days and tell you the moment something matches.
      </p>
    </motion.div>
  );
}
