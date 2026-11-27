import { Camera, Check, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/ui/logo";
import { Picture, type ImageName } from "@/ui/picture";

const CHIP_ICONS = { camera: Camera, check: Check, lock: Lock, sparkles: Sparkles };

function ChipIcon({ name }: { name: keyof typeof CHIP_ICONS }) {
  const Icon = CHIP_ICONS[name];
  return <Icon aria-hidden className="size-4 text-coral" />;
}

type AuthShellProps = {
  art: ImageName;
  quote: string;
  quoteBy: string;
  chips: Array<{ icon: keyof typeof CHIP_ICONS; text: string; className: string }>;
  children: React.ReactNode;
};

/**
 * Form on paper, story on the right. On phones the artwork becomes a short
 * banner above the form so the form is still the first thing you can touch.
 */
export function AuthShell({ art, quote, quoteBy, chips, children }: AuthShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col px-5 pt-5 pb-10 sm:px-10 lg:px-16 lg:pt-8">
        <Link href="/" aria-label="Homeward home" className="relative z-10 self-start">
          <Logo />
        </Link>

        <div className="relative -mx-5 mt-5 h-[210px] overflow-hidden sm:-mx-10 lg:hidden">
          <Picture name={art} alt="" sizes="100vw" priority className="block size-full" imgClassName="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper" />
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-6 lg:py-12">{children}</div>

        <p className="mx-auto max-w-[440px] text-center text-[13px] text-ink-2">
          Found something and in a hurry?{" "}
          <Link href="/found/new" className="font-semibold text-ink underline decoration-coral decoration-2 underline-offset-4">
            Log it as a guest
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-green lg:block">
        <Picture name={art} alt="" sizes="55vw" priority className="absolute inset-0 block" imgClassName="size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,90,68,0)_40%,rgba(11,69,53,0.92))]" />

        {chips.map((chip, i) => (
          <span
            key={chip.text}
            className={`glass animate-drift absolute flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold text-ink shadow-soft ${chip.className}`}
            style={{ animationDelay: `${i * -2.3}s` }}
          >
            <ChipIcon name={chip.icon} />
            {chip.text}
          </span>
        ))}

        <figure className="absolute inset-x-12 bottom-12 text-paper">
          <blockquote className="font-display-tight max-w-[520px] text-[40px] leading-[1.05] xl:text-[48px]">
            “{quote}”
          </blockquote>
          <figcaption className="mt-5 text-[15px] font-medium text-paper/80">{quoteBy}</figcaption>
        </figure>
      </aside>
    </div>
  );
}
