import type { Claim, Notice } from "@/core/domain/claim";
import type { Category } from "@/core/domain/item";
import type { Listing } from "@/core/domain/listing";
import type { User } from "@/core/domain/user";
import type {
  ClaimRepository,
  ListingRepository,
  PhotoStorage,
  UserRepository,
} from "@/core/ports";

type State = {
  users: Map<string, User>;
  listings: Map<string, Listing>;
  claims: Claim[];
  notices: Notice[];
  photos: Map<string, { bytes: Uint8Array; contentType: string }>;
};

// Survives hot reloads in dev. One process only: use the AWS adapters for anything shared.
const globalState = globalThis as unknown as { __homeward?: State };
const state: State = (globalState.__homeward ??= {
  users: new Map(),
  listings: new Map(),
  claims: [],
  notices: [],
  photos: new Map(),
});

const newestFirst = <T extends { createdAt: Date }>(a: T, b: T) =>
  b.createdAt.getTime() - a.createdAt.getTime();

export class MemoryListingRepository implements ListingRepository {
  async create(listing: Listing) {
    state.listings.set(listing.id, listing);
  }
  async get(id: string) {
    return state.listings.get(id);
  }
  async recent(limit: number) {
    return [...state.listings.values()].sort(newestFirst).slice(0, limit);
  }
  async byFinder(userId: string) {
    return [...state.listings.values()].filter((l) => l.finder.userId === userId).sort(newestFirst);
  }
  async listOpen(filter?: { category?: Category }) {
    return [...state.listings.values()].filter(
      (l) => l.status !== "claimed" && (!filter?.category || l.category === filter.category),
    );
  }
  async count() {
    return state.listings.size;
  }
  async markReturned(id: string, returnedTo: string) {
    const listing = state.listings.get(id);
    if (listing) state.listings.set(id, { ...listing, status: "claimed", returnedTo });
  }
}

export class MemoryUserRepository implements UserRepository {
  async create(user: User) {
    state.users.set(user.id, user);
  }
  async get(id: string) {
    return state.users.get(id);
  }
  async byEmail(email: string) {
    return [...state.users.values()].find((u) => u.email === email);
  }
  async byMatric(matric: string) {
    return [...state.users.values()].find((u) => u.matric === matric);
  }
  async addKarma(id: string, points: number) {
    const user = state.users.get(id);
    if (user) user.karma += points;
  }
}

export class MemoryClaimRepository implements ClaimRepository {
  async create(claim: Claim) {
    state.claims.push(claim);
  }
  async forItem(itemId: string) {
    return state.claims.filter((c) => c.itemId === itemId).sort(newestFirst);
  }
  async byClaimant(userId: string) {
    return state.claims.filter((c) => c.claimantId === userId).sort(newestFirst);
  }
  async addNotice(notice: Notice) {
    state.notices.push(notice);
  }
  async notices(userId: string) {
    return state.notices.filter((n) => n.userId === userId).sort(newestFirst);
  }
}

export class MemoryPhotoStorage implements PhotoStorage {
  async put(key: string, bytes: Uint8Array, contentType: string) {
    state.photos.set(key, { bytes, contentType });
  }
  async get(key: string) {
    return state.photos.get(key);
  }
}
