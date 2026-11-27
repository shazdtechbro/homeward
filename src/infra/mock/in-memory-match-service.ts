import { requiresPrivateMatch } from "@/core/domain/item";
import { listingText, type Listing } from "@/core/domain/listing";
import type { LostReport } from "@/core/domain/lost-report";
import { cosine, rankMatches, titleOverlap } from "@/core/domain/matching";
import type { Embedder, ListingRepository, MatchService } from "@/core/ports";

/**
 * Field scoring plus, when an embedder is wired, meaning-based similarity.
 * Listings saved with an embedding reuse it; older ones are embedded once and cached.
 */
export class HybridMatchService implements MatchService {
  private readonly cache = new Map<string, number[]>();

  constructor(
    private readonly items: ListingRepository,
    private readonly embedder?: Embedder,
  ) {}

  private async vectorFor(listing: Listing) {
    if (listing.embedding) return listing.embedding;
    const cached = this.cache.get(listing.id);
    if (cached) return cached;
    const vector = await this.embedder?.embed(listingText(listing));
    if (vector) this.cache.set(listing.id, vector);
    return vector;
  }

  async findMatches(report: LostReport) {
    const [open, scanned] = await Promise.all([this.items.listOpen(), this.items.count()]);
    // Private categories (ID cards) are matched by matric number elsewhere, never listed here.
    const candidates = open.filter((item) => !requiresPrivateMatch(item.category));
    const query = this.embedder ? await this.embedder.embed(report.text) : undefined;
    if (!query) {
      // No embedding model: rank by how many of the item's title words the person used.
      return {
        scanned,
        matches: rankMatches(report, candidates, 3, 0.25, (item) =>
          titleOverlap(report.text, item.title),
        ),
      };
    }

    const vectors = new Map<string, number[]>();
    await Promise.all(
      candidates.map(async (c) => {
        const v = await this.vectorFor(c);
        if (v) vectors.set(c.id, v);
      }),
    );
    return {
      scanned,
      matches: rankMatches(report, candidates, 3, 0.25, (item) => {
        const v = vectors.get(item.id);
        return v ? cosine(query, v) : undefined;
      }),
    };
  }
}
