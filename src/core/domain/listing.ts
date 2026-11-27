import type { FoundItem } from "./item";

/** How the owner can reach the finder. Only revealed after ownership is proved. */
export type FinderContact = {
  name: string;
  phone?: string;
  email?: string;
  /** Set when the finder was signed in; guests leave it empty. */
  userId?: string;
};

/**
 * The finder asks something only the owner would know ("What's the lock-screen
 * picture?"). The answer is stored server-side and never sent to the browser.
 */
export type OwnershipCheck = { question: string; answer: string };

export type Listing = FoundItem & {
  description: string;
  finder: FinderContact;
  check: OwnershipCheck;
  /** ID cards: the matric number read off the card, used for private matching only. */
  matric?: string;
  createdAt: Date;
  returnedTo?: string;
  /** Optional embedding of the listing text, for meaning-based search. */
  embedding?: number[];
  /** Lets a guest finder (no account) close their listing from a private link. */
  manageToken?: string;
};

/** The text a listing is embedded from: what a person would say describing it. */
export const listingText = (
  l: Pick<Listing, "title" | "brand" | "colour" | "category" | "description" | "place">,
) =>
  [
    l.title,
    l.brand,
    l.colour,
    l.category.replace("-", " "),
    l.description,
    `found near ${l.place.name}`,
  ]
    .filter(Boolean)
    .join(". ");

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "it",
  "of",
  "and",
  "with",
  "on",
  "in",
  "my",
  "its",
  "it's",
]);

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));

/**
 * Lenient on wording, strict on substance: most of the finder's key words must
 * appear in the owner's answer. "green super eagles sticker" passes for
 * "A green Super Eagles one"; "blue" does not.
 */
export function answerMatches(expected: string, given: string, threshold = 0.6): boolean {
  const wanted = tokens(expected);
  if (wanted.length === 0) return false;
  const offered = new Set(tokens(given));
  const hits = wanted.filter(
    (word) => offered.has(word) || [...offered].some((o) => o.length > 3 && word.startsWith(o)),
  ).length;
  return hits / wanted.length >= threshold;
}

export const MAX_CLAIM_ATTEMPTS = 3;
