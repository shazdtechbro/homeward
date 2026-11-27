"use client";

import { motion } from "motion/react";
import { cn } from "@/ui/cn";

type FloatingChipProps = {
  className?: string;
  delay: number;
  drift: number;
  children: React.ReactNode;
};

export function FloatingChip({ className, delay, drift, children }: FloatingChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay }}
      className={cn("absolute z-10", className)}
    >
      <div
        className="animate-drift rounded-full px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-ink shadow-soft glass sm:text-[15px]"
        style={{ animationDelay: `${drift}s` }}
      >
        {children}
      </div>
    </motion.div>
  );
}
