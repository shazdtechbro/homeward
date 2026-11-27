#!/usr/bin/env node
// Converts /assets-src PNGs into responsive AVIF + WebP variants in /public/images
// and writes src/ui/image-manifest.json (intrinsic size, available widths, blur placeholder).
//
//   pnpm images            build everything that is missing or stale
//   pnpm images --force    rebuild all

import { mkdir, readdir, stat, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public", "images");
const MANIFEST = path.join(ROOT, "src", "ui", "image-manifest.json");

const TARGET_WIDTHS = [640, 1024, 1600, 2400];
const FORCE = process.argv.includes("--force");

// Some assets arrive as one contact sheet; cut them out by pixel rectangle.
const SHEET_CROPS = {
  "story-persona-sticker-sunset-sheet": {
    "persona-emeka": { left: 1480, top: 272, width: 224, height: 254 },
    "sticker-panic": { left: 8, top: 588, width: 250, height: 280 },
    "sticker-its-gone": { left: 268, top: 588, width: 254, height: 280 },
    "sticker-dance": { left: 514, top: 588, width: 248, height: 286 },
    "cta-halftone-sunset": { left: 780, top: 557, width: 926, height: 344 },
  },
};

function widthsFor(sourceWidth) {
  const widths = TARGET_WIDTHS.filter((w) => w < sourceWidth);
  return [...widths, Math.min(sourceWidth, TARGET_WIDTHS.at(-1))];
}

async function blurDataUrl(image) {
  const buffer = await image
    .clone()
    .resize(16, null, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

async function isFresh(name, sourceMtime, previous) {
  if (FORCE || !previous[name]) return false;
  const largest = path.join(OUT, `${name}-${previous[name].widths.at(-1)}.avif`);
  return existsSync(largest) && (await stat(largest)).mtimeMs >= sourceMtime;
}

async function buildVariants(name, image, sourceMtime, previous) {
  const { width, height } = await image.metadata();
  if (await isFresh(name, sourceMtime, previous)) return previous[name];

  const widths = widthsFor(width);
  await Promise.all(
    widths.flatMap((w) => [
      image
        .clone()
        .resize(w)
        .avif({ quality: 52, effort: 5 })
        .toFile(path.join(OUT, `${name}-${w}.avif`)),
      image
        .clone()
        .resize(w)
        .webp({ quality: 74 })
        .toFile(path.join(OUT, `${name}-${w}.webp`)),
    ]),
  );
  console.log(`  ${name.padEnd(28)} ${width}×${height} → ${widths.join(", ")}`);
  return { width, height, widths, blurDataURL: await blurDataUrl(image) };
}

/** A tiling film-grain texture: far cheaper to paint than a live SVG noise filter. */
async function buildGrain() {
  const size = 160;
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(Math.random() * 256);
    pixels.set([v, v, v, 255], i * 4);
  }
  await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 16 })
    .toFile(path.join(ROOT, "public", "grain.png"));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await buildGrain();
  const previous = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
  const manifest = {};

  const files = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
  for (const file of files) {
    const name = path.basename(file, ".png");
    const sourcePath = path.join(SRC, file);
    const { mtimeMs } = await stat(sourcePath);
    const crops = SHEET_CROPS[name];

    if (crops) {
      for (const [cropName, rect] of Object.entries(crops)) {
        const cropped = sharp(await sharp(sourcePath).extract(rect).toBuffer());
        manifest[cropName] = await buildVariants(cropName, cropped, mtimeMs, previous);
      }
      continue;
    }
    manifest[name] = await buildVariants(name, sharp(sourcePath), mtimeMs, previous);
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n${Object.keys(manifest).length} images → public/images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
