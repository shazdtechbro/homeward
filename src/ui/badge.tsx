import { cn } from "./cn";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/70 py-1.5 pr-4 pl-1.5 text-[13px] font-semibold text-ink-2 ring-1 ring-ink/10",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BadgeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-coral px-2.5 py-0.5 text-[12px] font-bold text-white">{children}</span>
  );
}
