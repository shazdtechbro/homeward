import type { LostReport } from "@/core/domain/lost-report";
import { rankMatches } from "@/core/domain/matching";
import type { ItemRepository, MatchService } from "@/core/ports";

export class InMemoryMatchService implements MatchService {
  constructor(private readonly items: ItemRepository) {}

  async findMatches(report: LostReport) {
    const [candidates, scanned] = await Promise.all([this.items.listOpen(), this.items.count()]);
    return { scanned, matches: rankMatches(report, candidates) };
  }
}
