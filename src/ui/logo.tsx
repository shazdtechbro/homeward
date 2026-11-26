import { cn } from "./cn";

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="10" className="fill-green" />
        <path
          d="M9 15.5 16 9.5l7 6V23a1 1 0 0 1-1 1h-3.5v-4.5h-5V24H10a1 1 0 0 1-1-1z"
          className="fill-paper"
        />
        <circle cx="23.5" cy="9.5" r="2.5" className="fill-coral" />
      </svg>
      <span
        className={cn(
          "font-display text-[22px] font-semibold tracking-[-0.03em]",
          tone === "paper" ? "text-paper" : "text-ink",
        )}
      >
        Homeward
      </span>
    </span>
  );
}
