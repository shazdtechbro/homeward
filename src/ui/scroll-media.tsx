"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "./cn";

type ScrollMediaProps = { children: React.ReactNode; className?: string; kenBurns?: boolean };

/**
 * Large photos grow from 0.92 to 1 and unclip as they scroll in, then breathe
 * with a slow Ken Burns loop. Reduced motion gets the finished frame.
 */
export function ScrollMedia({ children, className, kenBurns = true }: ScrollMediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(12% 8% 12% 8% round 32px)", "inset(0% 0% 0% 0% round 32px)"],
  );

  return (
    <motion.div
      ref={ref}
      data-playing={inView}
      className={cn("overflow-hidden rounded-lg", className)}
      style={reduce ? undefined : { scale, clipPath }}
    >
      <div className={cn("size-full", kenBurns && "animate-ken-burns will-change-transform")}>
        {children}
      </div>
    </motion.div>
  );
}
