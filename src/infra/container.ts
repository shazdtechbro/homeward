import "server-only";
import type { ItemRepository, MatchService, ReportParser } from "@/core/ports";
import { env } from "@/lib/env";
import { buildCatalogue } from "./mock/catalogue";
import { InMemoryItemRepository } from "./mock/in-memory-item-repository";
import { InMemoryMatchService } from "./mock/in-memory-match-service";
import { KeywordReportParser } from "./mock/keyword-report-parser";

export type Services = {
  items: ItemRepository;
  reportParser: ReportParser;
  matcher: MatchService;
};

function createMockServices(): Services {
  const items = new InMemoryItemRepository(buildCatalogue());
  return {
    items,
    reportParser: new KeywordReportParser(),
    matcher: new InMemoryMatchService(items),
  };
}

const factories: Record<typeof env.HOMEWARD_ADAPTERS, () => Services> = {
  mock: createMockServices,
};

let services: Services | undefined;

/** The single composition root: every route gets its adapters from here. */
export function getServices(): Services {
  services ??= factories[env.HOMEWARD_ADAPTERS]();
  return services;
}
