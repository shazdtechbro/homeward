#!/usr/bin/env node
// Renders the 1200×630 link-preview card (WhatsApp, X, LinkedIn, Slack) to
// src/app/opengraph-image.jpg, which Next.js wires into og:image and twitter:image.
//
//   node scripts/build-og-image.mjs

import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const W = 1200;
const H = 630;

const overlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#0b4535" stop-opacity="0.97"/>
      <stop offset="0.52" stop-color="#0f5a44" stop-opacity="0.88"/>
      <stop offset="0.78" stop-color="#0f5a44" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <g transform="translate(72,76)">
    <rect width="52" height="52" rx="16" fill="#fbf8f1"/>
    <path d="M14 26 26 16l12 10v12a1.6 1.6 0 0 1-1.6 1.6h-5.6v-7.2h-9.6v7.2h-5.6A1.6 1.6 0 0 1 14 38z" fill="#0f5a44"/>
    <circle cx="39" cy="15" r="4.5" fill="#ea5a2f"/>
    <text x="68" y="37" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#fbf8f1">Homeward</text>
  </g>
  <text x="72" y="268" font-family="Georgia, serif" font-size="66" font-weight="700" fill="#fbf8f1">Everything lost</text>
  <text x="72" y="344" font-family="Georgia, serif" font-size="66" font-weight="700" fill="#fbf8f1">on campus finds</text>
  <text x="72" y="420" font-family="Georgia, serif" font-size="66" font-style="italic" fill="#f6c04a">its way home.</text>
  <text x="74" y="490" font-family="Arial, sans-serif" font-size="25" fill="#fbf8f1" fill-opacity="0.85">AI lost-and-found for the University of Ilorin</text>
  <g transform="translate(72,526)">
    <rect width="318" height="48" rx="24" fill="#ea5a2f"/>
    <text x="159" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#141412">Snap · Match · Prove · Collect</text>
  </g>
</svg>`;

await sharp(path.join(ROOT, "assets-src/01-hero.png"))
  .resize(W, H, { fit: "cover", position: "right" })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(ROOT, "src/app/opengraph-image.jpg"));

console.log("src/app/opengraph-image.jpg written");
