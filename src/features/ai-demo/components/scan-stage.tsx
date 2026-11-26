"use client";

import { motion } from "motion/react";
import { CountUp } from "@/ui/count-up";
import { Picture, type ImageName } from "@/ui/picture";
import { Radar } from "@/ui/radar";

const RULED_OUT: ImageName[] = [
  "found-calculator",
  "found-keys",
  "found-backpack",
  "found-phone",
  "found-umbrella",
  "found-wristwatch",
  "found-notebook",
  "found-charger",
  "found-scarf",
  "found-glasses",
];

/** Positions on a ring around the radar, as % of the stage, spread so neighbours never overlap. */
const orbit = (i: number) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  return { left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 40}%` };
};

export function ScanStage({ scanned }: { scanned: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 sm:flex-row sm:gap-14">
      <div className="relative size-[230px] sm:size-[280px]">
        <Radar className="size-full" />
        {RULED_OUT.map((name, i) => (
          <motion.div
            key={name}
            className="absolute -mt-7 -ml-7 size-14 overflow-hidden rounded-[14px] bg-white shadow-soft ring-2 ring-white"
            style={orbit(i)}
            initial={{ opacity: 0, scale: 0.4, y: 14 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.7], y: [14, 0, 0, -6] }}
            transition={{ duration: 1.25, delay: 0.15 + i * 0.24, times: [0, 0.25, 0.7, 1] }}
          >
            <Picture name={name} alt="" sizes="56px" imgClassName="size-full object-cover" />
          </motion.div>
        ))}
      </div>

      <div className="text-center sm:text-left">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-ink-2 uppercase">Smart Match</p>
        <p className="font-display-tight mt-2 text-[44px] sm:text-[56px]">
          <CountUp to={scanned} duration={2.4} />
        </p>
        <p className="mt-2 max-w-[16rem] text-[15px] font-medium text-ink-2">
          Scanning {scanned} found items across campus…
        </p>
      </div>
    </div>
  );
}
