import type { ImageName } from "@/ui/picture";

export type Story = {
  id: string;
  image: ImageName;
  alt: string;
  name: string;
  detail: string;
  headline: string;
  quote: string;
  elapsed: string;
};

export const STORIES: Story[] = [
  {
    id: "aisha",
    image: "story-aisha-id",
    alt: "Aisha smiling and holding up her recovered student ID card",
    name: "Aisha",
    detail: "200L Law",
    headline: "ID card back in 1 hour, two days before exams.",
    quote: "I got an email saying my card was at the library Spot before I'd even finished panicking.",
    elapsed: "1h 04m",
  },
  {
    id: "femi",
    image: "story-laptop",
    alt: "Femi hugging his recovered black HP laptop in a campus corridor",
    name: "Femi",
    detail: "400L Mechanical Engineering",
    headline: "Laptop back the same night. Final-year project intact.",
    quote: "Three questions only I could answer, a pickup code, and it was in my hands.",
    elapsed: "3h 12m",
  },
  {
    id: "chiamaka",
    image: "story-phone",
    alt: "Chiamaka laughing as she checks her recovered phone by the campus shuttle",
    name: "Chiamaka",
    detail: "100L Mass Communication",
    headline: "Phone back before the next shuttle left.",
    quote: "Someone found it on the bus, snapped one photo, and Homeward did the rest.",
    elapsed: "38m",
  },
];
