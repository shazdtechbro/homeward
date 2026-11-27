import type { Scene } from "./scene";
import type { SearchResponse } from "./schema";

const laptop: SearchResponse = {
  scanned: 214,
  fields: [
    { label: "Category", value: "Laptop", evidence: "laptop" },
    { label: "Colour", value: "Black", evidence: "black" },
    { label: "Brand", value: "HP", evidence: "HP" },
    { label: "Place", value: "Reading Room 2", evidence: "Reading Room 2" },
    { label: "When", value: "Last night", evidence: "last night" },
  ],
  outcome: {
    kind: "matches",
    matches: [
      {
        id: "itm_hp01",
        title: "Black HP laptop",
        place: "Library desk",
        when: "10:14 pm",
        score: 92,
        imageKey: "match-laptop-hp",
        readyAtSpot: true,
      },
      {
        id: "itm_dl02",
        title: "Black Dell laptop",
        place: "Engineering",
        when: "yesterday",
        score: 61,
        imageKey: "match-laptop-dell",
        readyAtSpot: false,
      },
      {
        id: "itm_sl03",
        title: "Grey laptop sleeve",
        place: "Shuttle Park",
        when: "2 days ago",
        score: 34,
        imageKey: "match-sleeve",
        readyAtSpot: false,
      },
    ],
  },
};

const idCard: SearchResponse = {
  scanned: 214,
  fields: [
    { label: "Category", value: "ID card", evidence: "student ID card" },
    { label: "Place", value: "Main Library", evidence: "Main Library" },
  ],
  outcome: { kind: "private" },
};

type ScriptedScene = Omit<Scene, "result"> & { response: SearchResponse };

const SCRIPTED_SCENES: ScriptedScene[] = [
  {
    id: "laptop",
    query: "I lost my black HP laptop in Reading Room 2 last night.",
    pickupCode: "4821",
    typingSpeed: 42,
    response: laptop,
  },
  {
    id: "id-card",
    query: "Lost my student ID card near the Main Library",
    pickupCode: "",
    typingSpeed: 42,
    response: idCard,
  },
];

export function scriptedScene(index: number): Scene {
  const { response, ...scene } = SCRIPTED_SCENES[index % SCRIPTED_SCENES.length]!;
  return { ...scene, result: Promise.resolve(response) };
}
