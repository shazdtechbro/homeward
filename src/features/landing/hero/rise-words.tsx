"use client";

import { motion } from "motion/react";
import { cn } from "@/ui/cn";
import { STAGGER } from "@/ui/motion";

type RiseWordsProps = { text: string; className?: string; delay?: number };

/** Each word rises out of its own clipping mask, staggered. */
export function RiseWords({ text, className, delay = 0 }: RiseWordsProps) {
  return (
    <span className={cn("block", className)}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: delay + i * STAGGER }}
          >
            {word}
          </motion.span>
          {" "}
        </span>
      ))}
    </span>
  );
}
