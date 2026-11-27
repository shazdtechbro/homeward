"use client";

import { MotionConfig } from "motion/react";

/** The app screens skip smooth scrolling: forms and lists should feel native. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}>
      {children}
    </MotionConfig>
  );
}
