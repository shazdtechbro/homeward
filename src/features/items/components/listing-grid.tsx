import { Check } from "lucide-react";
import Link from "next/link";
import { ItemPhoto } from "@/ui/item-photo";
import type { ListingCard } from "../view";

export function ListingGrid({ items, empty }: { items: ListingCard[]; empty?: React.ReactNode }) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/items/${item.id}`} className="group block overflow-hidden rounded-[20px] bg-white ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="relative aspect-square overflow-hidden bg-paper-2">
              <ItemPhoto imageKey={item.imageKey} alt={item.title} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="size-full" imgClassName="transition duration-500 group-hover:scale-105" />
              {item.returned && <span className="absolute top-2.5 left-2.5 rounded-full bg-green px-2.5 py-1 text-[11px] font-bold text-paper"><Check aria-hidden className="mr-0.5 inline size-3 align-[-2px]" />Returned</span>}
              {item.demo && !item.returned && <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-2">Demo</span>}
            </div>
            <div className="p-3">
              <p className="truncate text-[14px] font-semibold">{item.title}</p>
              <p className="mt-0.5 truncate text-[12px] text-ink-2">
                {item.place} · {item.when}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
