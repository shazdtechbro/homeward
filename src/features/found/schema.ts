import { z } from "zod";
import { PLACES } from "@/core/domain/campus-places";
import { CATEGORIES } from "@/core/domain/item";

export const PLACE_KEYS = Object.keys(PLACES) as Array<keyof typeof PLACES>;

export const WHEN_OPTIONS = {
  now: { label: "Just now", hoursAgo: 0 },
  today: { label: "Earlier today", hoursAgo: 3 },
  yesterday: { label: "Yesterday", hoursAgo: 24 },
  older: { label: "2+ days ago", hoursAgo: 48 },
} as const;

export const COLOUR_OPTIONS = [
  ["black", "#141412"],
  ["white", "#ffffff"],
  ["grey", "#9a9a94"],
  ["silver", "#cfd3d6"],
  ["blue", "#2f5fb3"],
  ["green", "#0f5a44"],
  ["red", "#c8402a"],
  ["orange", "#ea5a2f"],
  ["yellow", "#f6c04a"],
  ["brown", "#7a5234"],
  ["pink", "#f2a2b8"],
  ["purple", "#6b4fa0"],
] as const;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

export const foundItemSchema = z
  .object({
    title: z.string().trim().min(3, "Give it a short name, like “Black HP laptop”.").max(60),
    category: z.enum(CATEGORIES, { message: "Pick what kind of item it is." }),
    colour: z.string().trim().toLowerCase().min(3, "Pick the main colour.").max(20),
    brand: optionalText(30),
    place: z.union([z.enum(PLACE_KEYS as [string, ...string[]]), z.literal("other")], {
      message: "Where did you find it?",
    }),
    placeOther: optionalText(60),
    when: z.enum(Object.keys(WHEN_OPTIONS) as [keyof typeof WHEN_OPTIONS], {
      message: "When did you find it?",
    }),
    description: optionalText(280),
    question: z.string().trim().min(8, "Ask something only the owner would know.").max(120),
    answer: z.string().trim().min(2, "Add the answer you’d expect.").max(80),
    matric: optionalText(20),
    contactName: z.string().trim().min(2, "Tell the owner who to look for.").max(60),
    contactPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{10,15}$/, "Use a number like 0803 123 4567.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("That email doesn’t look right.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => v.place !== "other" || v.placeOther, {
    message: "Type where you found it.",
    path: ["placeOther"],
  })
  .refine((v) => v.contactPhone || v.contactEmail, {
    message: "Leave a phone number or an email so the owner can reach you.",
    path: ["contactPhone"],
  });

export type FoundItemInput = z.infer<typeof foundItemSchema>;

/** Questions that work well for each kind of item; the finder can write their own. */
export const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  laptop: ["What sticker is on the lid?", "What’s the wallpaper?", "Any scratch or dent? Where?"],
  phone: [
    "What’s the lock-screen picture?",
    "What colour is the case?",
    "Anything tucked in the case?",
  ],
  "id-card": ["Which faculty is printed on it?", "What’s the surname on the card?"],
  bag: ["What’s in the front pocket?", "Any keyring or badge on it?"],
  keys: ["What else hangs on the key ring?", "How many keys are there?"],
  calculator: ["Any name or mark on the back?", "What model number is it?"],
  default: ["Describe one detail that isn’t in the photo.", "Is there a name or mark on it?"],
};
