import { KeyRound, MapPin, MessageCircle } from "lucide-react";

const STEPS = [
  { Icon: MessageCircle, text: "Message the finder and agree a time." },
  {
    Icon: MapPin,
    text: "Meet somewhere public on campus: the library foyer, the SUB, a faculty entrance.",
  },
  { Icon: KeyRound, text: "Show this code. The finder enters it, then hands your item over." },
];

/** The owner's side of the meet-up. */
export function PickupCodeCard({ code }: { code: string }) {
  return (
    <div className="rounded-[24px] bg-sun p-6">
      <p className="text-[13px] font-bold tracking-[0.12em] uppercase">Your pickup code</p>
      <p
        className="mt-2 font-mono text-[56px] leading-none font-semibold tracking-[0.25em]"
        aria-label={`Pickup code ${code.split("").join(" ")}`}
      >
        {code}
      </p>
      <ol className="mt-5 space-y-2.5">
        {STEPS.map(({ Icon, text }, i) => (
          <li key={text} className="flex items-start gap-3 text-[15px]">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-paper"
              aria-hidden
            >
              <Icon className="size-3.5" />
            </span>
            <span>
              <span className="sr-only">Step {i + 1}: </span>
              {text}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13px] text-ink/70">
        Keep it to yourself until you’re face to face. Never pay anyone to get your item back.
      </p>
    </div>
  );
}
