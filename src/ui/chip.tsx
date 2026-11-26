import { cn } from "./cn";

/** A parsed AI field: small uppercase label over a mono value. */
export function FieldChip({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 rounded-full bg-ink px-3.5 py-2 text-paper",
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.08em] text-paper/55 uppercase">{label}</span>
      <span className="font-mono text-[13px]">{value}</span>
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 rounded-full", className)} />;
}
