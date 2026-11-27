import "server-only";
import { CATEGORY_LABELS } from "@/core/domain/item";
import type { Listing } from "@/core/domain/listing";
import { foundAtLabel } from "@/lib/time";

/**
 * What a browser may see about a listing. Never the ownership answer, the
 * finder's contact, the matric number, the embedding or the manage token.
 */
export type ListingCard = {
  id: string;
  title: string;
  category: string;
  place: string;
  when: string;
  imageKey: string;
  returned: boolean;
  demo: boolean;
};

export const toCard = (l: Listing): ListingCard => ({
  id: l.id,
  title: l.title,
  category: CATEGORY_LABELS[l.category],
  place: l.place.name,
  when: foundAtLabel(l.foundAt),
  imageKey: l.imageKey,
  returned: l.status === "claimed",
  demo: l.id.startsWith("itm_"),
});
