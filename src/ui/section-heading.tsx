import { cn } from "./cn";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  accent?: string;
  lede?: string;
  align?: "center" | "left";
  tone?: "ink" | "paper";
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  accent,
  lede,
  align = "center",
  tone = "ink",
  className,
}: SectionHeadingProps) {
  const centred = align === "center";
  return (
    <div className={cn("mx-auto max-w-[1180px]", centred && "text-center", className)}>
      <Reveal>
        <p
          className={cn(
            "text-[13px] font-bold tracking-[0.12em] uppercase",
            tone === "paper" ? "text-sun" : "text-coral",
          )}
        >
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <h2
          id={id}
          className={cn(
            "font-display-tight mt-4 text-[44px] sm:text-[72px] lg:text-[88px]",
            tone === "paper" && "text-paper",
          )}
        >
          {title}
          {accent && <span className="block text-coral italic">{accent}</span>}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "mt-6 max-w-[36rem] text-[18px] leading-relaxed font-medium",
              centred && "mx-auto",
              tone === "paper" ? "text-paper/75" : "text-ink-2",
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  );
}
