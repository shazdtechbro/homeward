"use client";

import { motion } from "motion/react";
import { FieldChip } from "@/ui/chip";
import type { ParsedField } from "../schema";

export function ParsedFields({ fields }: { fields: ParsedField[] }) {
  return (
    <div className="flex gap-3">
      <AiAvatar />
      <div>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[15px] font-semibold text-ink"
        >
          Homeward AI understood your report
        </motion.p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {fields.map((field, i) => (
            <motion.li
              key={field.label}
              initial={{ opacity: 0, y: -36, scale: 0.7, rotate: -4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.25 + i * 0.12 }}
            >
              <FieldChip label={field.label} value={field.value} />
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AiAvatar() {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-green text-paper"
    >
      <svg viewBox="0 0 32 32" className="size-5 fill-current">
        <path d="M9 15.5 16 9.5l7 6V23a1 1 0 0 1-1 1h-3.5v-4.5h-5V24H10a1 1 0 0 1-1-1z" />
      </svg>
    </span>
  );
}
