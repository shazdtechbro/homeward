import { Sparkles } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { DesktopNav, MobileTabBar } from "@/features/app-shell/app-nav";
import { currentUser } from "@/lib/session";
import { buttonClass } from "@/ui/button";
import { Logo } from "@/ui/logo";
import { AppProviders } from "@/ui/app-providers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const initials = user?.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppProviders>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5">
          <Link href="/home" aria-label="Homeward home">
            <Logo />
          </Link>
          <DesktopNav />
          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden rounded-full bg-sun/50 px-3 py-1.5 font-mono text-[12px] sm:inline"
                title="Karma"
              >
                <Sparkles aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
                {user.karma}
              </span>
              <Link
                href="/home#account"
                className="grid size-10 place-items-center rounded-full bg-green text-[14px] font-bold text-paper"
                aria-label="Your account"
              >
                {initials}
              </Link>
              <form action={signOut} className="hidden md:block">
                <button className="rounded-full px-3 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/sign-in" className={buttonClass({ size: "md", className: "h-10" })}>
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pt-8 pb-36 md:pb-20">{children}</main>
      <MobileTabBar signedIn={Boolean(user)} />
    </AppProviders>
  );
}
