"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, buttonClass } from "@/ui/button";

/** Any unexpected error lands here instead of a blank screen, with a one-tap retry. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-sun" aria-hidden>
        <RotateCcw className="size-7" />
      </span>
      <h1 className="mt-6 font-display-tight text-[40px]">Something slipped.</h1>
      <p className="mt-3 text-ink-2">
        That didn’t load properly. It’s usually a network blip; try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" variant="coral" onClick={reset}>
          Try again
        </Button>
        <Link href="/home" className={buttonClass({ size: "lg", variant: "ghost" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
