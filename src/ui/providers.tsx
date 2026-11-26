"use client";

import { MotionConfig } from "motion/react";
import { SmoothScroll } from "./smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.55 }}>
      <SmoothScroll>{children}</SmoothScroll>
    </MotionConfig>
  );
}
