"use client";

import { motion } from "motion/react";

const COLOURS = ["var(--color-coral)", "var(--color-sun)", "var(--color-green)", "var(--color-sky)"];
const PIECES = 22;

/** Deterministic pseudo-random in [0, 1) so the burst looks organic but never shifts between renders. */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const pieces = Array.from({ length: PIECES }, (_, i) => {
  const angle = (i / PIECES) * Math.PI * 2 + noise(i) * 0.5;
  const distance = 70 + noise(i + 7) * 90;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 30,
    rotate: (noise(i + 3) - 0.5) * 540,
    colour: COLOURS[i % COLOURS.length],
    round: i % 3 === 0,
  };
});

export function Confetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
      {pieces.map((piece, i) => (
        <motion.span
          key={i}
          className={piece.round ? "absolute size-2 rounded-full" : "absolute h-1.5 w-3 rounded-[2px]"}
          style={{ background: piece.colour }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: piece.x, y: [0, piece.y, piece.y + 40], opacity: [1, 1, 0], rotate: piece.rotate, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </span>
  );
}
