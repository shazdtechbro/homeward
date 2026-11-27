import type { Place } from "@/core/domain/campus";

export const PLACES = {
  readingRoom2: { name: "Reading Room 2", zone: "library" },
  libraryDesk: { name: "Main Library", zone: "library" },
  cbt: { name: "CBT Centre", zone: "library" },
  engineering: { name: "Faculty of Engineering", zone: "engineering" },
  shuttlePark: { name: "Shuttle Park", zone: "transport" },
  senate: { name: "Senate Building", zone: "admin" },
  law: { name: "Faculty of Law", zone: "law" },
  sports: { name: "Sports Complex", zone: "sports" },
  sub: { name: "Student Union Building", zone: "sub" },
  arts: { name: "Faculty of Arts", zone: "arts" },
} satisfies Record<string, Place>;

/** Words people actually use, longest first so "reading room 2" beats "library". */
export const PLACE_ALIASES: Array<[string, Place]> = [
  ["reading room 2", PLACES.readingRoom2],
  ["reading room", PLACES.readingRoom2],
  ["main library", PLACES.libraryDesk],
  ["library", PLACES.libraryDesk],
  ["cbt", PLACES.cbt],
  ["engineering", PLACES.engineering],
  ["shuttle", PLACES.shuttlePark],
  ["senate", PLACES.senate],
  ["law", PLACES.law],
  ["sports", PLACES.sports],
  ["student union", PLACES.sub],
  ["sub", PLACES.sub],
  ["arts", PLACES.arts],
];
