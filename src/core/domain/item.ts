import type { Place } from "./campus";

export const CATEGORIES = [
  "laptop",
  "laptop-sleeve",
  "phone",
  "id-card",
  "earbuds",
  "keys",
  "bag",
  "calculator",
  "charger",
  "power-bank",
  "glasses",
  "notebook",
  "scarf",
  "umbrella",
  "bottle",
  "watch",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ItemStatus = "logged" | "ready-at-spot" | "claimed";

export const CATEGORY_LABELS: Record<Category, string> = {
  laptop: "Laptop",
  "laptop-sleeve": "Laptop sleeve",
  phone: "Phone",
  "id-card": "ID card",
  earbuds: "Earbuds",
  keys: "Keys",
  bag: "Bag",
  calculator: "Calculator",
  charger: "Charger",
  "power-bank": "Power bank",
  glasses: "Glasses",
  notebook: "Notebook",
  scarf: "Scarf",
  umbrella: "Umbrella",
  bottle: "Bottle",
  watch: "Watch",
};

export type FoundItem = {
  id: string;
  title: string;
  category: Category;
  colour: string;
  brand?: string;
  place: Place;
  foundAt: Date;
  status: ItemStatus;
  imageKey: string;
};

/** Categories that carry personal identifiers are never listed publicly. */
const PRIVATE_CATEGORIES: ReadonlySet<Category> = new Set(["id-card"]);

export const requiresPrivateMatch = (category: Category | undefined) =>
  category !== undefined && PRIVATE_CATEGORIES.has(category);
