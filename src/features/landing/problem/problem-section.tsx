"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { CountUp } from "@/ui/count-up";
import { Picture } from "@/ui/picture";
import { Reveal } from "@/ui/reveal";
import { ScrollMedia } from "@/ui/scroll-media";
import { SectionHeading } from "@/ui/section-heading";

const thousands = (value: number) => Math.round(value).toLocaleString("en-NG");

const STATS = [
  { to: 50000, format: (v: number) => `${thousands(v)}+`, label: "students across faculties and colleges" },
  { to: 50, format: (v: number) => `>${Math.round(v)}%`, label: "live off campus and commute in daily" },
  { to: 15000, format: thousands, label: "hectares of campus to lose things on" },
  { to: 9, format: (v: number) => `${Math.round(v)} in 10`, label: "students don’t know where lost-and-found is" },
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="about" aria-labelledby="problem-title" className="scroll-mt-20">
      <div ref={ref} className="relative overflow-hidden bg-green py-28 sm:py-40">
        <motion.div aria-hidden className="absolute inset-[-14%_0]" style={reduce ? undefined : { y }}>
          <Picture
            name="04-exam-night"
            alt=""
            sizes="100vw"
            className="block size-full"
            imgClassName="size-full object-cover"
          />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-green/85" />

        <div className="relative px-5">
          <SectionHeading
            id="problem-title"
            tone="paper"
            align="left"
            eyebrow="The problem"
            title="Things go missing every day."
            accent="Almost none find their way back."
            lede="A lost ID means a missed exam. A lost laptop means a lost project. And the lost-and-found is a cupboard most students have never heard of."
          />

          <dl className="mx-auto mt-16 grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-10 sm:mt-24 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.06} className="border-t border-paper/25 pt-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <CountUp
                    to={stat.to}
                    format={stat.format}
                    whenInView
                    duration={1.8}
                    className="font-display-tight block text-[44px] text-sun sm:text-[64px]"
                  />
                  <p aria-hidden className="mt-3 max-w-[14rem] text-[15px] font-medium text-paper/80">
                    {stat.label}
                  </p>
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>

      <div className="px-4 pt-6 sm:pt-8">
        <ScrollMedia className="mx-auto aspect-[4/5] max-w-[1400px] sm:aspect-[21/9]">
          <Picture
            name="05-campus-life"
            alt="Students between lectures on a busy UNILORIN walkway"
            sizes="(min-width: 1400px) 1400px, 100vw"
            className="block size-full"
            imgClassName="size-full object-cover"
          />
        </ScrollMedia>
      </div>
    </section>
  );
}
