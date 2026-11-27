import type { Category } from "@/core/domain/item";
import type { Listing } from "@/core/domain/listing";
import type { ListingRepository } from "@/core/ports";
import { buildCatalogue, SIMULATED_INVENTORY_SIZE } from "./mock/catalogue";

const QUESTIONS: Partial<Record<Category, [string, string]>> = {
  laptop: ["What sticker is on the lid?", "green super eagles sticker"],
  phone: ["What is the lock-screen picture?", "a family photo at the beach"],
  calculator: ["What name is scratched on the back?", "tunde"],
  keys: ["What else hangs on the key ring?", "small red bottle opener"],
  bag: ["What is in the front pocket?", "blue pen and handout"],
  "id-card": ["Which faculty is printed on the card?", "engineering"],
};

const DEMO_FINDER = { name: "Homeward demo finder", email: "demo@homeward.ng" };

/**
 * A handful of realistic finds so a fresh deployment never opens on an empty
 * campus. They are read-only and clearly labelled as demo listings.
 */
export function demoListings(now = Date.now()): Listing[] {
  return buildCatalogue(now).map((item) => {
    const [question, answer] = QUESTIONS[item.category] ?? [
      "Describe one detail that isn't in the photo.",
      item.colour,
    ];
    return {
      ...item,
      description: `${item.title}, handed in near ${item.place.name}. Demo listing.`,
      finder: DEMO_FINDER,
      check: { question, answer },
      createdAt: item.foundAt,
    };
  });
}

export const isDemoListing = (id: string) => id.startsWith("itm_");

/** Merges the demo listings into any real repository, newest first. */
export function withDemoSeeds(repo: ListingRepository): ListingRepository {
  const seeds = () => demoListings();
  const newestFirst = (a: Listing, b: Listing) => b.createdAt.getTime() - a.createdAt.getTime();

  return {
    create: (listing) => repo.create(listing),
    byFinder: (userId) => repo.byFinder(userId),
    async get(id) {
      return isDemoListing(id) ? seeds().find((s) => s.id === id) : repo.get(id);
    },
    async recent(limit) {
      return [...(await repo.recent(limit)), ...seeds()].sort(newestFirst).slice(0, limit);
    },
    async listOpen(filter) {
      const all = [...(await repo.listOpen(filter)), ...seeds()];
      return all.filter(
        (item) =>
          item.status !== "claimed" && (!filter?.category || item.category === filter.category),
      );
    },
    async count() {
      return SIMULATED_INVENTORY_SIZE + (await repo.count());
    },
    async markReturned(id, returnedTo) {
      if (!isDemoListing(id)) await repo.markReturned(id, returnedTo);
    },
  };
}
