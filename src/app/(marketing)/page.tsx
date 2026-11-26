import { AiDemoSection } from "@/features/ai-demo/components/ai-demo-section";
import { AwsStrip } from "@/features/landing/aws/aws-strip";
import { FinalCta } from "@/features/landing/cta/final-cta";
import { FeaturesSection } from "@/features/landing/features/features-section";
import { SiteFooter } from "@/features/landing/footer/site-footer";
import { Hero } from "@/features/landing/hero/hero";
import { HowItWorksSection } from "@/features/landing/how-it-works/how-it-works-section";
import { SiteNav } from "@/features/landing/nav/site-nav";
import { ProblemSection } from "@/features/landing/problem/problem-section";
import { SafetySection } from "@/features/landing/safety/safety-section";
import { StorySection } from "@/features/landing/story/story-section";

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <AiDemoSection />
        <StorySection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SafetySection />
        <AwsStrip />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
