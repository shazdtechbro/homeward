"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Picture } from "@/ui/picture";
import { FloatingChip } from "./floating-chip";

const SIZES = "100vw";

/**
 * The halftone campus split into three depth bands (sky, buildings, foreground)
 * by stacking the same image under soft gradient masks. Each band drifts at its
 * own rate, so the scene opens up as you scroll without any seams at rest.
 */
const LAYERS = [
  { id: "sky", mask: "none", travel: 70 },
  { id: "buildings", mask: "linear-gradient(to bottom, transparent 22%, #000 40%)", travel: 36 },
  { id: "foreground", mask: "linear-gradient(to bottom, transparent 58%, #000 74%)", travel: 0 },
] as const;

export function HeroIllustration() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const zoom = useTransform(scrollYProgress, [0.3, 1], [1, 1.08]);

  return (
    <div ref={ref} className="relative mt-16 overflow-hidden sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.5 }}
        style={reduce ? undefined : { scale: zoom }}
        className="relative aspect-[4/3] w-full sm:aspect-[1914/822]"
      >
        {LAYERS.map((layer, i) => (
          <Layer key={layer.id} progress={scrollYProgress} travel={reduce ? 0 : layer.travel}>
            <Picture
              name="hero-halftone"
              alt={i === 0 ? "Illustration of students walking through a sunny UNILORIN courtyard" : ""}
              sizes={SIZES}
              priority={i === 0}
              className="absolute inset-0"
              imgClassName="size-full object-cover object-[30%_50%]"
              mask={layer.mask}
            />
          </Layer>
        ))}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
      </motion.div>

      <FloatingChip className="top-[18%] left-[4%] sm:left-[9%]" delay={1.1} drift={0}>
        <span className="text-success">●</span> Calculator · Main Library · <b>Logged</b>
      </FloatingChip>
      <FloatingChip className="top-[44%] right-[4%] sm:right-[8%]" delay={1.35} drift={1.6}>
        <span className="text-coral">●</span> Black HP laptop · <b>92% match</b>
      </FloatingChip>
    </div>
  );
}

function Layer({
  progress,
  travel,
  children,
}: {
  progress: MotionValue<number>;
  travel: number;
  children: React.ReactNode;
}) {
  const y = useTransform(progress, [0, 1], [-travel / 2, travel / 2]);
  return (
    <motion.div className="absolute inset-[-40px_0]" style={travel ? { y } : undefined}>
      {children}
    </motion.div>
  );
}
