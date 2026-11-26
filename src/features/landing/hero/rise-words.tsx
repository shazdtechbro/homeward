import { cn } from "@/ui/cn";
import { STAGGER } from "@/ui/motion";

type RiseWordsProps = { text: string; className?: string; delay?: number };

/**
 * Each word rises out of its own clipping mask, staggered. Plain CSS so the
 * headline animates (and paints) before any JavaScript arrives.
 */
export function RiseWords({ text, className, delay = 0 }: RiseWordsProps) {
  return (
    <span className={cn("block", className)}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className="animate-rise inline-block" style={{ animationDelay: `${delay + i * STAGGER}s` }}>
            {word}
          </span>
          {" "}
        </span>
      ))}
    </span>
  );
}
