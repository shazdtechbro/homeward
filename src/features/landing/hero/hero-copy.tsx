"use client";

import { motion } from "motion/react";
import { Arrow, Button, ButtonLink } from "@/ui/button";
import { Badge, BadgeTag } from "@/ui/badge";
import { useScrollTo } from "@/ui/smooth-scroll";
import { RiseWords } from "./rise-words";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay },
});

export function HeroCopy() {
  const scrollTo = useScrollTo();

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col items-center px-5 text-center">
      <motion.div {...fadeUp(0.05)}>
        <Badge>
          <BadgeTag>New</BadgeTag>
          Built for UNILORIN
        </Badge>
      </motion.div>

      <h1
        id="hero-title"
        className="font-display-tight mt-7 text-[52px] sm:text-[84px] lg:text-[124px] xl:text-[136px]">
        <RiseWords text="Everything lost on campus" delay={0.15} />
        <RiseWords text="finds its way home." delay={0.45} className="text-coral italic" />
      </h1>

      <motion.p
        {...fadeUp(0.75)}
        className="mt-7 max-w-[34rem] text-[18px] leading-relaxed font-medium text-ink-2 sm:text-[19px]"
      >
        Snap it, match it, prove it, collect it. The safest way to return lost things at UNILORIN.
      </motion.p>

      <motion.div {...fadeUp(0.9)} className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink href="#get-the-app" size="lg" variant="coral">
          Report something <Arrow />
        </ButtonLink>
        <Button size="lg" variant="ghost" onClick={() => scrollTo("#demo")}>
          I lost something
        </Button>
      </motion.div>
    </div>
  );
}
