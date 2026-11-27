import type { ImageAnalyzer } from "@/core/ports";

/** Locally there is no vision model: the finder simply picks the category. */
export class NoOpImageAnalyzer implements ImageAnalyzer {
  async analyze() {
    return { labels: [] };
  }

  async isUnsafe() {
    return false;
  }
}
