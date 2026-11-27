import type { FoundItem } from "@/core/domain/item";
import { PLACES } from "@/core/domain/campus-places";

type Seed = Omit<FoundItem, "foundAt" | "status"> & { hoursAgo: number; ready?: boolean };

// prettier-ignore
const SEEDS: Seed[] = [
  { id: "itm_hp01", title: "Black HP laptop", category: "laptop", colour: "black", brand: "HP", place: PLACES.libraryDesk, hoursAgo: 14, ready: true, imageKey: "match-laptop-hp" },
  { id: "itm_dl02", title: "Black Dell laptop", category: "laptop", colour: "black", brand: "Dell", place: PLACES.engineering, hoursAgo: 26, imageKey: "match-laptop-dell" },
  { id: "itm_sl03", title: "Grey laptop sleeve", category: "laptop-sleeve", colour: "grey", place: PLACES.shuttlePark, hoursAgo: 50, imageKey: "match-sleeve" },
  { id: "itm_id04", title: "Student ID card", category: "id-card", colour: "white", place: PLACES.libraryDesk, hoursAgo: 1.5, ready: true, imageKey: "match-idcard" },
  { id: "itm_ap05", title: "White AirPods case", category: "earbuds", colour: "white", brand: "Apple", place: PLACES.sub, hoursAgo: 5, imageKey: "match-airpods" },
  { id: "itm_bp06", title: "Navy backpack", category: "bag", colour: "blue", place: PLACES.arts, hoursAgo: 3, imageKey: "found-backpack" },
  { id: "itm_ca07", title: "Casio scientific calculator", category: "calculator", colour: "black", brand: "Casio", place: PLACES.libraryDesk, hoursAgo: 0.7, ready: true, imageKey: "found-calculator" },
  { id: "itm_ch08", title: "Oraimo phone charger", category: "charger", colour: "white", brand: "Oraimo", place: PLACES.cbt, hoursAgo: 8, imageKey: "found-charger" },
  { id: "itm_gl09", title: "Black-framed glasses", category: "glasses", colour: "black", place: PLACES.law, hoursAgo: 20, imageKey: "found-glasses" },
  { id: "itm_ky10", title: "Keys on a leather fob", category: "keys", colour: "brown", place: PLACES.senate, hoursAgo: 2, ready: true, imageKey: "found-keys" },
  { id: "itm_nb11", title: "Green lecture notebook", category: "notebook", colour: "green", place: PLACES.readingRoom2, hoursAgo: 6, imageKey: "found-notebook" },
  { id: "itm_ph12", title: "Tecno phone, cracked screen", category: "phone", colour: "black", brand: "Tecno", place: PLACES.shuttlePark, hoursAgo: 1.2, imageKey: "found-phone" },
  { id: "itm_pb13", title: "Anker power bank", category: "power-bank", colour: "black", brand: "Anker", place: PLACES.sports, hoursAgo: 30, imageKey: "found-power-bank" },
  { id: "itm_sc14", title: "Orange patterned scarf", category: "scarf", colour: "orange", place: PLACES.arts, hoursAgo: 10, imageKey: "found-scarf" },
  { id: "itm_um15", title: "Black umbrella", category: "umbrella", colour: "black", place: PLACES.engineering, hoursAgo: 4, imageKey: "found-umbrella" },
  { id: "itm_wb16", title: "Steel water bottle", category: "bottle", colour: "silver", place: PLACES.sports, hoursAgo: 9, imageKey: "found-water-bottle" },
  { id: "itm_wt17", title: "Black wristwatch", category: "watch", colour: "black", place: PLACES.sub, hoursAgo: 16, imageKey: "found-wristwatch" },
];

/** A realistic share of the campus inventory that the demo pretends to scan. */
export const SIMULATED_INVENTORY_SIZE = 214;

/** Dates are relative to now so the demo never looks stale. */
export function buildCatalogue(now = Date.now()): FoundItem[] {
  return SEEDS.map(({ hoursAgo, ready, ...item }) => ({
    ...item,
    foundAt: new Date(now - hoursAgo * 3_600_000),
    status: ready ? "ready-at-spot" : "logged",
  }));
}
