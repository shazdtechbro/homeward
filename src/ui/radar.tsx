import { cn } from "./cn";

/** Concentric rings, three staggered pings and a slow sweep. Pure CSS, transform-only. */
export function Radar({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden>
      {[1, 0.72, 0.44].map((size) => (
        <span
          key={size}
          className="absolute inset-0 m-auto rounded-full border border-ink/10"
          style={{ width: `${size * 100}%`, height: `${size * 100}%` }}
        />
      ))}
      {[0, 0.8, 1.6].map((delay) => (
        <span
          key={delay}
          className="absolute inset-0 animate-radar-ping rounded-full border-2 border-coral/50"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <span className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,rgba(234,90,47,0.22),transparent_28%)]" />
      <span className="absolute inset-0 m-auto size-3 rounded-full bg-coral shadow-[0_0_0_6px_rgba(234,90,47,0.18)]" />
      {children}
    </div>
  );
}
