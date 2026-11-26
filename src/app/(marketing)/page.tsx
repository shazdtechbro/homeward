import { Hero } from "@/features/landing/hero/hero";
import { SiteNav } from "@/features/landing/nav/site-nav";

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
      </main>
    </>
  );
}
