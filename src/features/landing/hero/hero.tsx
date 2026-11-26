import { HeroCopy } from "./hero-copy";
import { HeroIllustration } from "./hero-illustration";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative pt-36 sm:pt-44">
      <HeroCopy />
      <HeroIllustration />
    </section>
  );
}
