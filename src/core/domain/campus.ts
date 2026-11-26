/** A named spot on campus. Places in the same zone are close enough to be confused. */
export type Place = { name: string; zone: string };

export function placeProximity(a: Place | undefined, b: Place): number {
  if (!a) return 0;
  if (a.name === b.name) return 1;
  return a.zone === b.zone ? 0.6 : 0;
}
