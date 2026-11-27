"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type CountUpProps = {
  to: number;
  duration?: number;
  /** Start counting only once the number scrolls into view. */
  whenInView?: boolean;
  format?: (value: number) => string;
  className?: string;
};

const defaultFormat = (value: number) => Math.round(value).toLocaleString("en-NG");

/** Writes straight to the text node, so counting never re-renders React. */
export function CountUp({
  to,
  duration = 1.6,
  whenInView = false,
  format = defaultFormat,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const shouldRun = !whenInView || inView;

  useEffect(() => {
    const node = ref.current;
    if (!node || !shouldRun) return;
    if (reduce) {
      node.textContent = format(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => (node.textContent = format(value)),
    });
    return () => controls.stop();
  }, [to, duration, format, reduce, shouldRun]);

  return (
    <span ref={ref} className={className}>
      {format(reduce ? to : 0)}
    </span>
  );
}
