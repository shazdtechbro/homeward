"use client";

import { motion } from "motion/react";

type RevealProps = { children: React.ReactNode; delay?: number; className?: string; y?: number };

/** Fades and lifts its children the first time they enter the viewport. */
export function Reveal({ children, delay = 0, className, y = 24 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}
