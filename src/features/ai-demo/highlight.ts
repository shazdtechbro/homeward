export type Segment = { text: string; highlighted: boolean };

/** Splits text into plain and highlighted runs, one highlight per evidence phrase (first occurrence). */
export function splitByEvidence(text: string, evidence: string[]): Segment[] {
  const lower = text.toLowerCase();
  const ranges = evidence
    .map((phrase) => {
      const start = lower.indexOf(phrase.toLowerCase());
      return { start, end: start + phrase.length };
    })
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start)
    .filter((range, i, all) => i === 0 || range.start >= all[i - 1]!.end);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}
