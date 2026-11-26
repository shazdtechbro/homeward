import type { Category, FoundItem } from "@/core/domain/item";
import type { ItemRepository } from "@/core/ports";
import { SIMULATED_INVENTORY_SIZE } from "./catalogue";

export class InMemoryItemRepository implements ItemRepository {
  constructor(private readonly items: FoundItem[]) {}

  async listOpen(filter?: { category?: Category }) {
    return this.items.filter(
      (item) =>
        item.status !== "claimed" && (!filter?.category || item.category === filter.category),
    );
  }

  async count() {
    return Math.max(this.items.length, SIMULATED_INVENTORY_SIZE);
  }
}
