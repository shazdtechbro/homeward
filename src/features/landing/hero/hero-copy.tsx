"use client";

import { Arrow, Button, ButtonLink } from "@/ui/button";
import { Badge, BadgeTag } from "@/ui/badge";
import { useScrollTo } from "@/ui/smooth-scroll";
import { RiseWords } from "./rise-words";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

export function HeroCopy() {
  const scrollTo = useScrollTo();

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col items-center px-5 text-center">
      <div className="animate-fade-up" style={delay(0.05)}>
        <Badge>
          <BadgeTag>New</BadgeTag>
          Built for UNILORIN
        </Badge>
      </div>

      <h1
        id="hero-title"
        className="font-display-tight mt-7 text-[52px] sm:text-[84px] lg:text-[124px] xl:text-[136px]"
      >
        <RiseWords text="Everything lost on campus" delay={0.15} />
        <RiseWords text="finds its way home." delay={0.45} className="text-coral italic" />
      </h1>

      <p
        className="animate-fade-up mt-7 max-w-[34rem] text-[18px] leading-relaxed font-medium text-ink-2 sm:text-[19px]"
        style={delay(0.75)}
      >
        Snap it, match it, prove it, collect it. The safest way to return lost things at UNILORIN.
      </p>

      <div
        className="animate-fade-up mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        style={delay(0.9)}
      >
        <ButtonLink href="#get-the-app" size="lg" variant="coral">
          Report something <Arrow />
        </ButtonLink>
        <Button size="lg" variant="ghost" onClick={() => scrollTo("#demo")}>
          I lost something
        </Button>
      </div>
    </div>
  );
}
