import { Picture, type ImageName } from "@/ui/picture";
import { Radar } from "@/ui/radar";
import { Reveal } from "@/ui/reveal";
import { SectionHeading } from "@/ui/section-heading";
import { InViewPlay } from "@/ui/in-view-play";

type Step = {
  title: string;
  body: string;
  note: string;
  media: { image: ImageName; alt: string } | "radar";
};

const STEPS: Step[] = [
  {
    title: "Snap & post",
    body: "The finder takes one photo. AI writes the listing, tags the category and hides anything personal.",
    note: "AI wrote · Black HP laptop · Library",
    media: { image: "02-finder", alt: "A student photographing a laptop left on a library desk" },
  },
  {
    title: "Smart match",
    body: "Homeward compares the photo and description with every lost report on campus, then pings the likely owner.",
    note: "92% match · owner notified",
    media: "radar",
  },
  {
    title: "Prove it’s yours",
    body: "The owner answers questions only they could know. No answers, no item, so nothing goes to the wrong hands.",
    note: "Q · What sticker is on the lid?",
    media: { image: "06-phone-moment", alt: "A student answering ownership questions on her phone" },
  },
  {
    title: "Collect at a Spot",
    body: "Pick it up from a staffed Homeward Spot with a one-time code. No meeting strangers, no phone numbers.",
    note: "Pickup code · 4821",
    media: { image: "03-handoff", alt: "A Homeward Spot attendant handing a student their recovered item" },
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 px-4 py-28 sm:py-40">
      <SectionHeading
        id="how-title"
        eyebrow="How it works"
        title="Four steps."
        accent="One way home."
        lede="Built so the right person gets their thing back, and nobody else does."
      />

      <ol className="mx-auto mt-16 grid max-w-[1180px] gap-5 sm:mt-24 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <Reveal
            key={step.title}
            as="li"
            delay={(i % 2) * 0.06}
            y={40}
            className="h-full rounded-lg bg-paper-2 p-3 sm:p-4"
          >
              <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                {step.media === "radar" ? <RadarMedia /> : <PhotoMedia {...step.media} />}
                <span className="glass absolute bottom-3 left-3 rounded-full px-3.5 py-2 font-mono text-[12px] sm:text-[13px]">
                  {step.note}
                </span>
              </div>
              <div className="flex gap-5 px-2 pt-6 pb-3 sm:px-3">
                <span className="font-mono text-[14px] text-coral">0{i + 1}</span>
                <div>
                  <h3 className="font-display-tight text-[30px] sm:text-[36px]">{step.title}</h3>
                  <p className="mt-3 max-w-[30rem] text-[17px] font-medium text-ink-2">{step.body}</p>
                </div>
              </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function PhotoMedia({ image, alt }: { image: ImageName; alt: string }) {
  return (
    <InViewPlay className="size-full">
      <div className="animate-ken-burns size-full">
        <Picture
          name={image}
          alt={alt}
          sizes="(min-width: 768px) 560px, 92vw"
          className="block size-full"
          imgClassName="size-full object-cover"
        />
      </div>
    </InViewPlay>
  );
}

const ORBIT: Array<{ image: ImageName; className: string }> = [
  { image: "match-laptop-hp", className: "top-[16%] left-[58%] size-20 ring-coral" },
  { image: "found-keys", className: "top-[58%] left-[22%] size-14 ring-white opacity-60" },
  { image: "found-calculator", className: "top-[20%] left-[24%] size-12 ring-white opacity-50" },
];

function RadarMedia() {
  return (
    <InViewPlay className="relative grid size-full place-items-center bg-sky">
      <Radar className="w-[78%] max-w-[360px]" />
      {ORBIT.map(({ image, className }) => (
        <span key={image} className={`animate-drift absolute overflow-hidden rounded-[14px] bg-white shadow-soft ring-2 ${className}`}>
          <Picture name={image} alt="" sizes="80px" className="block size-full" imgClassName="size-full object-cover" />
        </span>
      ))}
    </InViewPlay>
  );
}
