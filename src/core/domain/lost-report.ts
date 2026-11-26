import type { Place } from "./campus";
import type { Category } from "./item";

/** A value pulled out of free text, with the exact words that justified it. */
export type Extracted<T> = { value: T; evidence: string };

export type LostReport = {
  text: string;
  category?: Extracted<Category>;
  colour?: Extracted<string>;
  brand?: Extracted<string>;
  place?: Extracted<Place>;
  when?: Extracted<string>;
};
