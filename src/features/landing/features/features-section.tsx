import { cn } from "@/ui/cn";
import { InViewPlay } from "@/ui/in-view-play";
import { Reveal } from "@/ui/reveal";
import { SectionHeading } from "@/ui/section-heading";
import {
  KarmaVisual,
  MaskedChatVisual,
  MatricMatchVisual,
  ProofVisual,
  SmartMatchVisual,
  SpotsMapVisual,
} from "./feature-visuals";

type Tile = {
  title: string;
  body: string;
  visual: React.ReactNode;
  className?: string;
};

const TILES: Tile[] = [
  {
    title: "Matric Match",
    body: "Found an ID card? Textract reads the matric number and we email the owner privately. It never appears in public.",
    visual: <MatricMatchVisual />,
    className: "lg:col-span-2",
  },
  {
    title: "AI Smart Match",
    body: "Photos and words compared at once, ranked by how likely each item is yours.",
    visual: <SmartMatchVisual />,
  },
  {
    title: "Proof of ownership",
    body: "Questions only the real owner can answer, written by AI from details the finder never sees.",
    visual: <ProofVisual />,
  },
  {
    title: "Homeward Spots",
    body: "Staffed pickup points at the library, SUB and faculties. Hand over, scan a code, done.",
    visual: <SpotsMapVisual />,
    className: "lg:col-span-2",
  },
  {
    title: "Masked chat",
    body: "Finders and owners can talk without swapping numbers or names.",
    visual: <MaskedChatVisual />,
  },
  {
    title: "Karma rewards",
    body: "Every return earns karma, redeemable at campus cafés and the bookshop. Honesty, rewarded.",
    visual: <KarmaVisual />,
    className: "bg-sun lg:col-span-2",
  },
];

export function FeaturesSection() {
  return (
    <section id="for-campus" aria-labelledby="features-title" className="scroll-mt-20 px-4 py-28 sm:py-40">
      <SectionHeading
        id="features-title"
        eyebrow="For campus"
        title="Small details."
        accent="Big relief."
        lede="Everything a lost-and-found should have been, designed for how UNILORIN actually moves."
      />

      <InViewPlay className="mx-auto mt-16 max-w-[1180px] sm:mt-24">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile, i) => (
            <Reveal
              key={tile.title}
              as="li"
              delay={i * 0.06}
              className={cn("flex flex-col rounded-lg bg-paper-2 p-6 sm:p-7", tile.className)}
            >
              <div className="flex min-h-[220px] flex-1 items-center justify-center">{tile.visual}</div>
              <h3 className="font-display-tight mt-6 text-[28px] sm:text-[32px]">{tile.title}</h3>
              <p className="mt-2 max-w-[28rem] text-[16px] font-medium text-ink-2">{tile.body}</p>
            </Reveal>
          ))}
        </ul>
      </InViewPlay>
    </section>
  );
}
