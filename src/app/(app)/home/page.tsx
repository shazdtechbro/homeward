import { Heart, IdCard, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { ListingGrid } from "@/features/items/components/listing-grid";
import { toCard } from "@/features/items/view";
import { getServices } from "@/infra/container";
import { currentUser } from "@/lib/session";
import { foundAtLabel } from "@/lib/time";
import { Picture } from "@/ui/picture";

export const metadata: Metadata = { title: "Home · Homeward" };
export const dynamic = "force-dynamic";

const NOTICE_ICON = { "id-card-match": IdCard, "claim-verified": ShieldCheck, returned: Heart } as const;

function NoticeIcon({ kind }: { kind: keyof typeof NOTICE_ICON }) {
  const Icon = NOTICE_ICON[kind];
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sun/60" aria-hidden>
      <Icon className="size-4" />
    </span>
  );
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-NG", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function HomePage() {
  const user = await currentUser();
  const { items, claims } = getServices();
  const [recent, myFinds, myClaims, notices] = await Promise.all([
    items.recent(12),
    user ? items.byFinder(user.id) : [],
    user ? claims.byClaimant(user.id) : [],
    user ? claims.notices(user.id) : [],
  ]);
  const publicRecent = recent.filter((l) => l.category !== "id-card" && l.status !== "claimed").slice(0, 8);
  const returnedCount = myFinds.filter((l) => l.status === "claimed").length;

  return (
    <div className="space-y-14">
      <section>
        <p className="text-[15px] font-semibold text-ink-2">{greeting()}{user ? `, ${user.name.split(" ")[0]}` : ""}</p>
        <h1 className="font-display-tight mt-2 text-[44px] sm:text-[64px]">
          What happened <em className="font-normal italic">today?</em>
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/lost" className="group relative overflow-hidden rounded-[32px] bg-sun p-7 transition hover:-translate-y-1 hover:shadow-lift sm:min-h-[300px]">
            <Picture name="sticker-panic" alt="" sizes="200px" className="absolute -right-4 -bottom-6 block w-[150px] mix-blend-multiply transition-transform duration-500 group-hover:rotate-6 sm:w-[200px]" imgClassName="w-full" />
            <span className="relative block text-[13px] font-bold tracking-[0.12em] uppercase">Lost something?</span>
            <span className="font-display-tight relative mt-3 block max-w-[260px] text-[36px] sm:text-[44px]">Describe it. AI finds it.</span>
            <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-paper">Start searching →</span>
          </Link>
          <Link href="/found/new" className="group relative overflow-hidden rounded-[32px] bg-coral p-7 transition hover:-translate-y-1 hover:shadow-lift sm:min-h-[300px]">
            <Picture name="sticker-dance" alt="" sizes="200px" className="absolute -right-4 -bottom-6 block w-[150px] mix-blend-multiply transition-transform duration-500 group-hover:-rotate-6 sm:w-[200px]" imgClassName="w-full" />
            <span className="relative block text-[13px] font-bold tracking-[0.12em] text-ink uppercase">Found something?</span>
            <span className="font-display-tight relative mt-3 block max-w-[260px] text-[36px] text-ink sm:text-[44px]">Snap it. Send it home.</span>
            <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[15px] font-semibold text-ink">Log a find →</span>
          </Link>
        </div>
      </section>

      {user ? (
        <section id="account" aria-labelledby="account-title" className="scroll-mt-24">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="rounded-[28px] bg-green p-6 text-paper">
              <h2 id="account-title" className="text-[13px] font-bold tracking-[0.12em] text-sun uppercase">Your karma</h2>
              <p className="font-display-tight mt-3 text-[64px]">{user.karma}</p>
              <p className="text-paper/80">
                {returnedCount} {returnedCount === 1 ? "item" : "items"} returned · {myFinds.length} logged
              </p>
              <dl className="mt-6 space-y-1.5 text-[14px] text-paper/85">
                <div className="flex justify-between gap-4"><dt>Email</dt><dd className="truncate">{user.email}</dd></div>
                {user.matric && <div className="flex justify-between gap-4"><dt>Matric</dt><dd className="font-mono">{user.matric}</dd></div>}
                {user.faculty && <div className="flex justify-between gap-4"><dt>Faculty</dt><dd>{user.faculty}</dd></div>}
              </dl>
              <form action={signOut} className="mt-6">
                <button className="rounded-full bg-paper/15 px-4 py-2 text-[13px] font-semibold">Sign out</button>
              </form>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-ink/5">
              <h2 className="text-[13px] font-bold tracking-[0.12em] text-ink-2 uppercase">Inbox</h2>
              {notices.length === 0 ? (
                <p className="mt-4 text-ink-2">Nothing yet. When someone claims your find, or your ID card turns up, it lands here.</p>
              ) : (
                <ul className="mt-3 divide-y divide-ink/5">
                  {notices.slice(0, 6).map((n) => (
                    <li key={n.id}>
                      <Link href={`/items/${n.itemId}`} className="flex items-start gap-3 py-3 hover:opacity-80">
                        <NoticeIcon kind={n.kind} />
                        <span>
                          <span className="block text-[15px] font-medium">{n.text}</span>
                          <span className="text-[12px] text-ink-2">{foundAtLabel(n.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {myFinds.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display-tight text-[30px]">Things you found</h2>
              <div className="mt-4">
                <ListingGrid items={myFinds.map(toCard)} />
              </div>
            </div>
          )}

          {myClaims.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display-tight text-[30px]">Your claims</h2>
              <ul className="mt-4 space-y-2">
                {myClaims.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link href={`/items/${c.itemId}`} className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 ring-1 ring-ink/5">
                      <span className="font-medium">{c.itemTitle}</span>
                      <span className={c.status === "verified" ? "text-[13px] font-semibold text-green" : "text-[13px] text-ink-2"}>
                        {c.status === "verified" ? (c.pickupCode ? `Pickup code ${c.pickupCode}` : "Proved, see contact") : "Answer didn’t match"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-ink/5 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold">Track your finds and claims</h2>
            <p className="mt-1 text-ink-2">An account gives you an inbox, karma, and private ID-card alerts.</p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
            <Link href="/sign-up" className="rounded-full bg-ink px-5 py-3 font-semibold text-paper">Create account</Link>
            <Link href="/sign-in" className="rounded-full px-5 py-3 font-semibold ring-1 ring-ink/15">Sign in</Link>
          </div>
        </section>
      )}

      <section aria-labelledby="campus-title">
        <div className="flex items-end justify-between">
          <h2 id="campus-title" className="font-display-tight text-[30px]">Just handed in</h2>
          <Link href="/lost#recent" className="text-[14px] font-semibold text-green">See all →</Link>
        </div>
        <div className="mt-4">
          <ListingGrid items={publicRecent.map(toCard)} />
        </div>
      </section>
    </div>
  );
}
