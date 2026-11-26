import { SectionHeading } from "@/ui/section-heading";
import { ChatDemo } from "./chat-demo";

export function AiDemoSection() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="relative scroll-mt-24 px-4 py-28 sm:py-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[22%] left-[8%] size-[420px] rounded-full bg-sky/60 blur-[110px]" />
        <div className="absolute top-[48%] right-[6%] size-[380px] rounded-full bg-sun/45 blur-[110px]" />
        <div className="absolute bottom-[12%] left-[38%] size-[300px] rounded-full bg-coral/20 blur-[110px]" />
      </div>

      <div className="relative">
        <SectionHeading
          id="demo-title"
          eyebrow="Homeward AI"
          title="Say what you lost."
          accent="We’ll do the looking."
          lede="Describe it the way you’d tell a friend. Homeward understands it, searches every found item on campus, and shows you only what could be yours."
        />
        <div className="mt-14 sm:mt-20">
          <ChatDemo />
        </div>
      </div>
    </section>
  );
}
