"use client";

import { motion } from "motion/react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "li";
};

/** Fades and lifts its children the first time they enter the viewport. */
export function Reveal({ children, delay = 0, className, y = 24, as = "div" }: RevealProps) {
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </Component>
  );
}
