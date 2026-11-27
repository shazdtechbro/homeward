"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/ui/cn";
import { Picture } from "@/ui/picture";
import { STORIES } from "./stories";

const AUTOPLAY_MS = 6500;

export function StorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.35 });
  const [index, setIndex] = useState(0);
  const story = STORIES[index]!;

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const wordX = useTransform(scrollYProgress, [0, 1], ["12%", "-38%"]);

  const go = (delta: number) => setIndex((i) => (i + delta + STORIES.length) % STORIES.length);

  useEffect(() => {
    if (!inView || reduce) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % STORIES.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, inView, reduce]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="stories-title"
      aria-roledescription="carousel"
      data-playing={inView}
      className="relative overflow-hidden bg-sun py-28 sm:py-40"
    >
      <motion.p
        aria-hidden
        style={reduce ? undefined : { x: wordX }}
        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-[30vw] leading-none font-extrabold tracking-[-0.06em] whitespace-nowrap text-paper sm:text-[22vw]"
      >
        RETURNED
      </motion.p>

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 lg:grid-cols-[1fr_minmax(0,400px)_1fr] lg:gap-14">
        <div className="lg:pb-24">
          <p className="text-[13px] font-bold tracking-[0.12em] text-ink uppercase">Real returns</p>
          <h2 id="stories-title" className="mt-4 font-display-tight text-[44px] sm:text-[60px]">
            Lost on Monday.
            <span className="block italic">Home by Monday.</span>
          </h2>
        </div>

        <div className="relative mx-auto w-full max-w-[400px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-ink shadow-lift">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={story.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="size-full animate-ken-burns">
                  <Picture
                    name={story.image}
                    alt={story.alt}
                    sizes="(min-width: 640px) 400px, 90vw"
                    className="block size-full"
                    imgClassName="size-full object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
            <span className="absolute top-4 left-4 rounded-full px-3 py-1.5 font-mono text-[12px] glass">
              Returned in {story.elapsed}
            </span>
          </div>
        </div>

        <div className="lg:pt-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
              aria-live="polite"
            >
              <p className="text-[15px] font-semibold">
                {story.name}, <span className="text-ink/70">{story.detail}</span>
              </p>
              <p className="mt-3 font-display-tight text-[30px] sm:text-[34px]">{story.headline}</p>
              <p className="mt-4 text-[17px] font-medium text-ink/75">
                &ldquo;{story.quote}&rdquo;
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-5">
            <div className="flex gap-2">
              <ArrowButton label="Previous story" onClick={() => go(-1)} direction="left" />
              <ArrowButton label="Next story" onClick={() => go(1)} direction="right" />
            </div>
            <div className="flex" role="tablist" aria-label="Stories">
              {STORIES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${s.name}'s story`}
                  onClick={() => setIndex(i)}
                  className="group grid h-11 place-items-center px-1"
                >
                  <span
                    className={cn(
                      "block h-2.5 rounded-full bg-ink transition-[width,opacity] duration-500",
                      i === index ? "w-8" : "w-2.5 opacity-30 group-hover:opacity-60",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-12 place-items-center rounded-full bg-ink text-[18px] text-sun transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      {direction === "left" ? "←" : "→"}
    </button>
  );
}
