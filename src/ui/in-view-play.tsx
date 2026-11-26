"use client";

import { useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "./cn";

/** Pauses every CSS animation inside until it is on screen, so offscreen loops cost nothing. */
export function InViewPlay({ children, className, ...props }: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  return (
    <div ref={ref} data-playing={inView} className={cn("group/play", className)} {...props}>
      {children}
    </div>
  );
}
