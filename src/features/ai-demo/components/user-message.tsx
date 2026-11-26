"use client";

import { motion } from "motion/react";
import { splitByEvidence } from "../highlight";

type UserMessageProps = { typed: string; evidence: string[]; typing: boolean };

export function UserMessage({ typed, evidence, typing }: UserMessageProps) {
  const segments = splitByEvidence(typed, evidence);

  return (
    <div className="flex justify-end">
      <p className="max-w-[34rem] min-h-[3.25rem] rounded-[22px] rounded-br-md bg-ink px-5 py-3.5 text-[17px] leading-[1.55] font-medium text-paper sm:text-[19px]">
        {segments.map((segment, i) =>
          segment.highlighted ? (
            <Highlight key={`${segment.text}-${i}`} delay={i * 0.06}>
              {segment.text}
            </Highlight>
          ) : (
            <span key={`${segment.text}-${i}`}>{segment.text}</span>
          ),
        )}
        {typing && <span aria-hidden className="animate-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-sun" />}
      </p>
    </div>
  );
}

function Highlight({ children, delay }: { children: string; delay: number }) {
  return (
    <mark className="relative inline-block bg-transparent px-0.5 text-ink">
      <motion.span
        aria-hidden
        className="absolute inset-x-0 inset-y-[2px] -z-0 origin-left rounded-[5px] bg-sun"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, delay }}
      />
      <motion.span
        className="relative"
        initial={{ color: "var(--color-paper)" }}
        animate={{ color: "var(--color-ink)" }}
        transition={{ duration: 0.2, delay: delay + 0.15 }}
      >
        {children}
      </motion.span>
    </mark>
  );
}
