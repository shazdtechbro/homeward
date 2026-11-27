import { Arrow, ButtonLink } from "@/ui/button";
import { Picture } from "@/ui/picture";
import { Reveal } from "@/ui/reveal";
import { ScrollMedia } from "@/ui/scroll-media";

export function FinalCta() {
  return (
    <section id="get-the-app" aria-labelledby="cta-title" className="scroll-mt-20 px-4 pb-6">
      <div className="mx-auto flex max-w-[1180px] items-end justify-center gap-4 pb-6" aria-hidden>
        <Sticker name="sticker-panic" className="-rotate-6" />
        <span className="mb-10 font-mono text-[14px] text-ink-2">38 min later →</span>
        <Sticker name="sticker-dance" className="rotate-6" />
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        <ScrollMedia className="absolute inset-0">
          <Picture
            name="cta-halftone-sunset"
            alt="Illustration of two students walking home across campus at sunset"
            sizes="(min-width: 1400px) 1400px, 100vw"
            className="block size-full"
            imgClassName="size-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,20,18,0.68),rgba(20,20,18,0.3)_75%)]"
          />
        </ScrollMedia>

        <div className="relative flex min-h-[560px] flex-col items-center justify-center px-6 py-20 text-center sm:aspect-[21/9] sm:min-h-0">
          <Reveal>
            <h2
              id="cta-title"
              className="max-w-[900px] font-display-tight text-[44px] text-paper drop-shadow-[0_4px_30px_rgba(20,20,18,0.45)] sm:text-[76px]"
            >
              Lost something?
              <span className="block text-sun italic">
                It&rsquo;s probably already on its way home.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/lost" size="lg" variant="coral">
              Find my thing <Arrow />
            </ButtonLink>
            <ButtonLink href="/sign-up" size="lg" variant="light">
              Join the UNILORIN beta
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Sticker({
  name,
  className,
}: {
  name: "sticker-panic" | "sticker-dance";
  className: string;
}) {
  return (
    <span className={`block w-24 mix-blend-multiply sm:w-32 ${className}`}>
      <Picture name={name} alt="" sizes="128px" className="block" imgClassName="h-auto w-full" />
    </span>
  );
}
