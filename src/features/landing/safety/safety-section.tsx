import { IdCard, Lock, PhoneOff, ShieldCheck } from "lucide-react";
import { Reveal } from "@/ui/reveal";
import { SectionHeading } from "@/ui/section-heading";

const PROMISES = [
  {
    Icon: ShieldCheck,
    title: "Prove it before you see anything",
    body: "Claimants answer a question only the real owner could know. Our AI allows for different wording but not for guesses, and three wrong answers locks the claim.",
  },
  {
    Icon: PhoneOff,
    title: "Your number stays hidden",
    body: "A finder's contact is revealed only to the person who proved ownership. Nobody browsing can see it.",
  },
  {
    Icon: IdCard,
    title: "ID cards are never listed",
    body: "Cards are matched privately by matric number. Only the student on the card is told, and only they can see its photo.",
  },
  {
    Icon: Lock,
    title: "Locked-down by design",
    body: "Photos sit in a private, encrypted S3 bucket. Passwords are hashed, sessions are signed, and every form is validated and rate-limited.",
  },
];

export function SafetySection() {
  return (
    <section
      id="safety"
      aria-labelledby="safety-title"
      className="scroll-mt-20 bg-green px-5 py-28 text-paper sm:py-40"
    >
      <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <SectionHeading
          id="safety-title"
          tone="paper"
          align="left"
          eyebrow="Safety"
          title="Private by default."
          accent="Safe by design."
          lede="Lost things carry personal details. Homeward is built so those details never leak, and the wrong person never walks away with your stuff."
          className="mx-0"
        />

        <ul className="grid gap-4 sm:grid-cols-2">
          {PROMISES.map((promise, i) => (
            <Reveal
              key={promise.title}
              as="li"
              delay={i * 0.06}
              className="rounded-lg border border-paper/15 bg-paper/[0.06] p-6"
            >
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-full bg-sun text-ink"
              >
                <promise.Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-[19px] font-semibold">{promise.title}</h3>
              <p className="mt-2 text-[16px] font-medium text-paper/75">{promise.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
