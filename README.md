# Homeward

Everything lost at UNILORIN finds its way home. A finder snaps one photo; AI writes the
listing, hides sensitive details and matches it to the owner's report; the owner proves
ownership with questions only they can answer; the item is collected at a staffed Homeward
Spot with a one-time code. ID cards are matched privately by matric number.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # unit tests (Vitest)
pnpm typecheck
pnpm images         # rebuild /public/images from /assets-src (only needed when art changes)
```

Node 22+, pnpm 10.

## Architecture

Feature-first, with business rules kept free of frameworks and AWS.

```
src/
  app/                 routes only: (marketing)/ landing, api/ route handlers
  features/
    landing/           nav, hero and the other landing sections
    ai-demo/           the chat demo: scene timeline, components, schema, server use case
  core/
    domain/            Item, LostReport, Match, Place + pure rules (scoring, privacy)
    ports/             interfaces: ItemRepository, ReportParser, MatchService,
                       ImageAnalyzer, Notifier, Storage
  infra/
    mock/              in-memory adapters (catalogue, keyword parser, matcher)
    container.ts       the single composition root
  lib/                 env (zod), errors, logger, rate limiting, time formatting
  ui/                  design-system primitives: Button, Badge, GlassCard, Chip,
                       Picture, Radar, CountUp, Confetti, Reveal, SmoothScroll
```

**Request path.** The browser only ever calls `POST /api/search`. The route validates input
with zod, rate-limits per client, and runs `searchLostItem`, which takes its parser and
matcher from the container. Sensitive categories (ID cards) never come back as listings: the
use case returns `{ kind: "private" }` and Matric Match notifies the owner out of band.

**Matching.** `core/domain/matching.ts` scores a candidate on category, brand, colour and
campus proximity. In production, Titan Multimodal Embeddings + S3 Vectors narrow the
candidates and this rule re-ranks them, so every score stays explainable.

### Mock vs AWS adapters

`src/infra/container.ts` picks the adapter set from `HOMEWARD_ADAPTERS` (validated in
`src/lib/env.ts`). Today only `mock` is wired. It runs entirely in-process and powers the
landing demo and local development. The AWS set implements the same ports:

| Port             | AWS adapter                                      |
| ---------------- | ------------------------------------------------ |
| `ReportParser`   | Bedrock (Amazon Nova) structured extraction      |
| `MatchService`   | Titan Multimodal Embeddings + S3 Vectors         |
| `ItemRepository` | DynamoDB                                         |
| `ImageAnalyzer`  | Rekognition (labels, faces to blur) + Textract   |
| `Storage`        | S3 presigned uploads                             |
| `Notifier`       | SES                                              |

Adding it means writing `createAwsServices()` and adding one entry to the `factories` map;
no route or component changes.

## Images

Source PNGs live in `/assets-src` (git-ignored). `scripts/build-images.mjs` uses sharp to
write AVIF + WebP at 640/1024/1600/2400 (capped at source width) into `/public/images`, plus
`src/ui/image-manifest.json` with sizes and blur placeholders. `<Picture>` feeds those
variants through `next/image`'s `getImageProps`, so AVIF is preferred via `<picture>` with a
WebP fallback. Some assets arrive on one contact sheet; the script crops them by rectangle.

## Motion

Motion (motion.dev) for components, Lenis for smooth scroll. The hero entrance is plain
CSS so it paints before hydration. Everything respects `prefers-reduced-motion`: Motion via
`MotionConfig reducedMotion="user"`, CSS via a global media query, and the demo timeline
jumps straight to its finished state.

## Deploy (AWS Amplify Hosting)

1. Push this repo to GitHub.
2. Amplify console → **Create new app** → GitHub → pick the repo and `main`.
3. Amplify detects Next.js SSR and uses `amplify.yml`. Set `HOMEWARD_ADAPTERS=mock`.
4. Every push to `main` deploys; pull requests get preview URLs once previews are enabled.
