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
      <svg viewBox="0 0 20 20" className="size-4.5 fill-current">
        <path d="M10 1.5 12.2 7.8 18.5 10l-6.3 2.2L10 18.5l-2.2-6.3L1.5 10l6.3-2.2z" />
      </svg>
    </span>
  );
}
