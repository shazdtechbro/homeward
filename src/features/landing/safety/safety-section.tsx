import { Reveal } from "@/ui/reveal";
import { SectionHeading } from "@/ui/section-heading";

const PROMISES = [
  {
    glyph: "@",
    title: "Verified university email",
    body: "Only @unilorin.edu.ng accounts can post or claim, through Cognito sign-in.",
  },
  {
    glyph: "◐",
    title: "IDs and faces auto-blurred",
    body: "Rekognition finds faces and cards in every photo and blurs them before anything is listed.",
  },
  {
    glyph: "✆",
    title: "No phone numbers shared",
    body: "Masked chat and staffed Spots mean nobody ever has to hand a stranger their number.",
  },
  {
    glyph: "#",
    title: "One-time pickup codes",
    body: "A code that works once, at one Spot, for one verified owner. Then it is gone.",
  },
];

export function SafetySection() {
  return (
    <section id="safety" aria-labelledby="safety-title" className="scroll-mt-20 bg-green px-5 py-28 text-paper sm:py-40">
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
              <span aria-hidden className="grid size-11 place-items-center rounded-full bg-sun font-mono text-[18px] text-ink">
                {promise.glyph}
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
