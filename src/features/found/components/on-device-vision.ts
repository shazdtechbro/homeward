import type { Category } from "@/core/domain/item";

/**
 * Reads the item's main colour straight from the photo, in the browser, instantly.
 * Nova on Bedrock adds full recognition (what it is, brand, title) when available.
 */

export type OnDeviceReading = {
  labels: string[];
  category?: Category;
  colour?: string;
};

const NAMED_COLOURS: Array<[string, [number, number, number]]> = [
  ["black", [25, 25, 25]],
  ["white", [240, 240, 240]],
  ["grey", [128, 128, 128]],
  ["silver", [192, 192, 196]],
  ["blue", [40, 80, 170]],
  ["green", [40, 120, 70]],
  ["red", [190, 40, 40]],
  ["orange", [230, 120, 40]],
  ["yellow", [235, 200, 60]],
  ["brown", [120, 80, 50]],
  ["pink", [235, 150, 180]],
  ["purple", [110, 70, 160]],
];

/** The colour of the middle of the photo, where the item usually is, snapped to a name. */
function dominantColour(img: HTMLImageElement): string | undefined {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(img, img.naturalWidth * 0.25, img.naturalHeight * 0.25, img.naturalWidth * 0.5, img.naturalHeight * 0.5, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const votes = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i]!, data[i + 1]!, data[i + 2]!];
    let best = "black";
    let bestDistance = Infinity;
    for (const [name, [cr, cg, cb]] of NAMED_COLOURS) {
      const distance = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = name;
      }
    }
    votes.set(best, (votes.get(best) ?? 0) + 1);
  }
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export async function readPhotoOnDevice(url: string): Promise<OnDeviceReading> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return { labels: [], colour: dominantColour(img) };
}
