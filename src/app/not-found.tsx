import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClass } from "@/ui/button";
import { Logo } from "@/ui/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="Homeward home">
        <Logo />
      </Link>
      <span className="mt-10 grid size-16 place-items-center rounded-full bg-sun" aria-hidden>
        <SearchX className="size-7" />
      </span>
      <h1 className="mt-6 font-display-tight text-[40px] sm:text-[52px]">
        This one hasn’t found its way <em className="font-normal italic">home</em> yet.
      </h1>
      <p className="mt-4 text-ink-2">
        The page may have moved, or the item was already returned. Try searching for it instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/lost" className={buttonClass({ size: "lg", variant: "coral" })}>
          Search lost items
        </Link>
        <Link href="/home" className={buttonClass({ size: "lg", variant: "ghost" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
