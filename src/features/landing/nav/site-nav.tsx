"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Arrow, ButtonLink } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Logo } from "@/ui/logo";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-campus", label: "For campus" },
  { href: "#safety", label: "Safety" },
  { href: "#about", label: "About" },
];

export function SiteNav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 32));

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        aria-label="Main"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className={cn(
          "flex w-full max-w-[1180px] items-center justify-between rounded-full py-2 pr-2 pl-5 transition-[background-color,box-shadow,border-color] duration-500",
          solid ? "glass shadow-soft" : "border border-transparent",
        )}
      >
        <Link href="/" aria-label="Homeward home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <a
            href="/sign-in"
            className="hidden rounded-full px-4 py-2 text-[15px] font-semibold text-ink sm:block"
          >
            Sign in
          </a>
          <ButtonLink href="#get-the-app" className="hidden sm:inline-flex">
            Get the app <Arrow />
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center rounded-full bg-ink text-paper lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <MenuIcon open={open} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="glass absolute inset-x-4 top-20 origin-top rounded-lg p-3 shadow-lift lg:hidden"
          >
            <ul className="flex flex-col">
              {[...LINKS, { href: "/sign-in", label: "Sign in" }].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-4 py-3.5 font-display text-2xl font-semibold tracking-[-0.02em]"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <ButtonLink href="#get-the-app" size="lg" className="mt-2 w-full">
              Get the app <Arrow />
            </ButtonLink>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <motion.path
        d="M3 7h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ rotate: open ? 45 : 0, y: open ? 3 : 0 }}
        style={{ originX: "50%", originY: "50%" }}
      />
      <motion.path
        d="M3 13h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ rotate: open ? -45 : 0, y: open ? -3 : 0 }}
        style={{ originX: "50%", originY: "50%" }}
      />
    </svg>
  );
}
