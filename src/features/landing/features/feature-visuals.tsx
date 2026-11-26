import { cn } from "@/ui/cn";
import { Picture } from "@/ui/picture";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

export function MatricMatchVisual() {
  return (
    <div className="relative mx-auto w-[300px] max-w-full">
      <div className="relative overflow-hidden rounded-[16px] bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.12em] text-green uppercase">University of Ilorin</span>
          <span className="h-2 w-10 rounded-full bg-coral" />
        </div>
        <div className="mt-3 flex gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-[10px]">
            <Picture name="persona-aisha" alt="" sizes="64px" className="block size-full" imgClassName="size-full scale-125 object-cover blur-[6px]" />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <span className="block h-2.5 w-4/5 rounded-full bg-ink/10" />
            <span className="block h-2.5 w-3/5 rounded-full bg-ink/10" />
            <span className="block font-mono text-[13px] text-ink">••/••EC/0421</span>
          </div>
        </div>
        <span className="animate-scan absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-sky/70 to-transparent" />
      </div>
      <span className="animate-drift glass absolute -right-3 -bottom-4 rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-soft">
        ✉︎ Emailed privately
      </span>
    </div>
  );
}

const BARS = [
  { label: "HP laptop", fill: 0.92, best: true },
  { label: "Dell laptop", fill: 0.61 },
  { label: "Sleeve", fill: 0.34 },
];

export function SmartMatchVisual() {
  return (
    <div className="w-full space-y-3.5">
      {BARS.map((bar, i) => (
        <div key={bar.label}>
          <div className="flex justify-between font-mono text-[12px] text-ink-2">
            <span>{bar.label}</span>
            <span className={bar.best ? "text-coral" : undefined}>{Math.round(bar.fill * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/8">
            <span
              className={cn("animate-fill block h-full origin-left rounded-full", bar.best ? "bg-coral" : "bg-ink/30")}
              style={{ ["--fill" as string]: bar.fill, ...delay(i * 0.18) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProofVisual() {
  return (
    <div className="flex w-full flex-col gap-2 text-[14px] font-medium">
      <p className="animate-cycle-in max-w-[85%] self-start rounded-[16px] rounded-bl-md bg-white px-3.5 py-2.5 shadow-soft" style={delay(0)}>
        What sticker is on the lid?
      </p>
      <p className="animate-cycle-in max-w-[85%] self-end rounded-[16px] rounded-br-md bg-ink px-3.5 py-2.5 text-paper" style={delay(0.7)}>
        A green Super Eagles one, peeling
      </p>
      <p className="animate-cycle-in self-start rounded-full bg-success px-3.5 py-2 text-[13px] font-semibold text-white" style={delay(1.4)}>
        ✓ 3 of 3 correct · Ownership proved
      </p>
    </div>
  );
}

const SPOTS = [
  { x: 118, y: 92, label: "Main Library" },
  { x: 300, y: 64, label: "Student Union" },
  { x: 236, y: 170, label: "Engineering" },
];

export function SpotsMapVisual() {
  return (
    <div className="relative size-full min-h-[220px]">
      <svg viewBox="0 0 420 240" className="absolute inset-0 size-full" aria-hidden>
        <rect width="420" height="240" rx="20" className="fill-sky/50" />
        <path d="M0 130 C 90 120, 140 40, 250 60 S 380 150, 420 120" className="fill-none stroke-white" strokeWidth="14" strokeLinecap="round" />
        <path d="M150 240 C 170 180, 210 140, 200 0" className="fill-none stroke-white" strokeWidth="10" strokeLinecap="round" />
        {[
          [40, 40, 60, 38],
          [330, 150, 64, 46],
          [60, 170, 70, 40],
          [270, 190, 52, 34],
          [340, 24, 54, 30],
        ].map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="8" className="fill-green/15" />
        ))}
      </svg>
      {SPOTS.map((spot, i) => (
        <span
          key={spot.label}
          className="absolute"
          style={{ left: `${(spot.x / 420) * 100}%`, top: `${(spot.y / 240) * 100}%` }}
        >
          <span className="animate-pulse-pin absolute -top-2 -left-2 size-4 rounded-full bg-coral/50" style={delay(i * 0.6)} />
          <span className="absolute -top-2 -left-2 size-4 rounded-full border-[3px] border-white bg-coral shadow-soft" />
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-soft">
            {spot.label}
          </span>
        </span>
      ))}
      <div className="glass absolute right-3 bottom-3 flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 shadow-soft">
        <span className="size-9 overflow-hidden rounded-full">
          <Picture name="persona-mrs-ibrahim" alt="" sizes="36px" className="block size-full" imgClassName="size-full object-cover" />
        </span>
        <span className="text-[12px] leading-tight">
          <b className="block">Mrs Ibrahim</b>
          <span className="text-success">● On duty · Library Spot</span>
        </span>
      </div>
    </div>
  );
}

export function MaskedChatVisual() {
  return (
    <div className="flex w-full flex-col gap-2 text-[14px] font-medium">
      <p className="animate-cycle-in self-start rounded-[16px] rounded-bl-md bg-white px-3.5 py-2.5 shadow-soft" style={delay(0)}>
        Hi! I think I found your calculator 🙂
      </p>
      <p className="animate-cycle-in self-end rounded-[16px] rounded-br-md bg-ink px-3.5 py-2.5 text-paper" style={delay(0.7)}>
        Yes!! Call me on <span className="rounded bg-paper/20 px-1 font-mono blur-[3px]">08031234521</span>
      </p>
      <p className="animate-cycle-in self-center rounded-full bg-sky/60 px-3 py-1.5 text-[12px] font-semibold" style={delay(1.4)}>
        🔒 Numbers stay hidden. Collect at a Spot instead.
      </p>
    </div>
  );
}

export function KarmaVisual() {
  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <span className="block size-24 overflow-hidden rounded-full ring-4 ring-paper sm:size-28">
          <Picture name="persona-emeka" alt="" sizes="112px" className="block size-full" imgClassName="size-full object-cover" />
        </span>
        {[0, 0.8, 1.6].map((d) => (
          <span key={d} className="animate-float-up absolute -top-2 right-0 rounded-full bg-ink px-2.5 py-1 font-mono text-[12px] text-sun" style={delay(d)}>
            +50
          </span>
        ))}
      </div>
      <div>
        <p className="font-display-tight text-[44px]">1,240</p>
        <p className="text-[14px] font-semibold">Emeka&rsquo;s karma · 26 returns</p>
      </div>
    </div>
  );
}
