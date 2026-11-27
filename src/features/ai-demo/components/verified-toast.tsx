"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Confetti } from "@/ui/confetti";

type VerifiedToastProps = { kind: "pickup" | "private"; pickupCode: string };

export function VerifiedToast({ kind, pickupCode }: VerifiedToastProps) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative flex items-center gap-3 rounded-full bg-ink py-2.5 pr-5 pl-2.5 text-paper shadow-lift"
    >
      {kind === "pickup" && <Confetti />}
      <span className="grid size-8 place-items-center rounded-full bg-success text-[15px]"><Check aria-hidden className="size-4" /></span>
      {kind === "pickup" ? (
        <span className="text-[14px] font-semibold sm:text-[15px]">
          Owner verified · Pickup code <span className="ml-1 font-mono text-sun">{pickupCode}</span>
        </span>
      ) : (
        <span className="text-[14px] font-semibold sm:text-[15px]">Private match sent to your Homeward inbox</span>
      )}
    </motion.div>
  );
}
