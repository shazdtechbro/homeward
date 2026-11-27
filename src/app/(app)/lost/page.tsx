import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/core/domain/item";
import { ListingGrid } from "@/features/items/components/listing-grid";
import { toCard } from "@/features/items/view";
import { LostSearch } from "@/features/lost/components/lost-search";
import { getServices } from "@/infra/container";
import { cn } from "@/ui/cn";

export const metadata: Metadata = { title: "Find what you lost · Homeward" };
export const dynamic = "force-dynamic";

const BROWSABLE: Category[] = CATEGORIES.filter((c) => c !== "id-card");

export default async function LostPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = BROWSABLE.includes(category as Category) ? (category as Category) : undefined;
  const recent = (await getServices().items.recent(60))
    .filter((l) => l.category !== "id-card" && l.status !== "claimed" && (!active || l.category === active))
    .slice(0, 24);

  return (
    <>
      <LostSearch />

      <section id="recent" aria-labelledby="recent-title" className="mt-20 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="recent-title" className="font-display-tight text-[34px] sm:text-[44px]">
              Recently found on campus
            </h2>
            <p className="mt-2 text-ink-2">Prefer to look yourself? Everything handed in, newest first. ID cards are never shown.</p>
          </div>
        </div>
        <nav aria-label="Filter by kind" className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2">
          {[undefined, ...BROWSABLE].map((c) => (
            <Link
              key={c ?? "all"}
              href={c ? `/lost?category=${c}#recent` : "/lost#recent"}
              scroll={false}
              aria-current={active === c ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold",
                active === c ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white hover:border-ink/30",
              )}
            >
              {c ? CATEGORY_LABELS[c] : "Everything"}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <ListingGrid items={recent.map(toCard)} empty={<p className="rounded-[20px] bg-white p-6 text-ink-2">Nothing in this category right now.</p>} />
        </div>
      </section>
    </>
  );
}
