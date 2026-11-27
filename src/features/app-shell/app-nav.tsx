"use client";

import { CircleUser, House, LayoutGrid, Plus, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/cn";

const LINKS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/lost", label: "I lost something", short: "Lost", icon: Search },
  { href: "/found/new", label: "I found something", short: "Found", icon: Plus },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/home" && pathname.startsWith(href));

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="App"
      className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-ink/8 md:flex"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(pathname, link.href) ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-[14px] font-semibold transition-colors",
            isActive(pathname, link.href) ? "bg-ink text-paper" : "text-ink-2 hover:text-ink",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Thumb-reach tab bar on phones, with "found" as the big coral action in the middle. */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [home, lost, found] = LINKS as [(typeof LINKS)[0], (typeof LINKS)[0], (typeof LINKS)[0]];
  const tab = (href: string, label: string, Icon: LucideIcon) => (
    <Link
      href={href}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
        isActive(pathname, href) ? "text-ink" : "text-ink-2",
      )}
    >
      <Icon aria-hidden className="size-5" strokeWidth={2} />
      {label}
    </Link>
  );

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex items-center rounded-[26px] bg-paper/95 px-2 py-1.5 shadow-lift ring-1 ring-ink/8 backdrop-blur-xl md:hidden"
    >
      {tab(home.href, home.label, home.icon)}
      {tab(lost.href, "Lost", lost.icon)}
      <Link
        href={found.href}
        aria-label="I found something"
        className="-mt-7 grid size-16 shrink-0 place-items-center rounded-full bg-coral text-[30px] font-light text-ink shadow-coral ring-4 ring-paper"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.25} />
      </Link>
      {tab("/lost#recent", "Browse", LayoutGrid)}
      {tab(signedIn ? "/home#account" : "/sign-in", signedIn ? "Me" : "Sign in", CircleUser)}
    </nav>
  );
}
