// Turns the one-line text a Data Interpretation question carries
// ("Bar chart: Sales of A, B, C in 2019: A=120, B=150, C=90.") into structured
// data a chart/table component can draw. Returns null for anything it can't
// read with confidence, so the caller falls back to showing the original text
// rather than a wrong picture.

export type DataKind = "bar" | "line" | "pie" | "table";

export interface ParsedData {
  kind: DataKind;
  title: string;
  /** Category labels (x-axis / rows). */
  labels: string[];
  /** One entry per data series; a single-series chart has exactly one. */
  series: { name: string; values: number[] }[];
}

const KIND_BY_PREFIX: [RegExp, DataKind][] = [
  [/^bar\s*(chart|graph)/i, "bar"],
  [/^line\s*(chart|graph)/i, "line"],
  [/^pie\s*(chart|graph)/i, "pie"],
  [/^table/i, "table"],
];

const NUMBER = /^-?\d+(?:[.,]\d+)*\s*(?:k|K|%|m|M|l|L)?$/;

/** "50k" -> 50, "30%" -> 30, "1,200" -> 1200. Units are dropped on purpose:
 *  every value in a series shares one, and the axis only needs proportion. */
function toNumber(raw: string): number | null {
  const t = raw.trim().replace(/[₹$€£]/g, "");
  if (!NUMBER.test(t)) return null;
  const n = parseFloat(t.replace(/,/g, "").replace(/[kKmMlL%]$/, ""));
  return Number.isFinite(n) ? n : null;
}

/** Splits on commas that aren't thousands separators ("1,200"). */
function splitList(s: string): string[] {
  return s.split(/,(?!\d{3}\b)/).map((x) => x.trim()).filter(Boolean);
}

function expandRange(label: string, count: number): string[] | null {
  const m = label.match(/(\d{4})\s*[-–to]+\s*(\d{4})/i);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2]);
  if (end < start || end - start + 1 !== count) return null;
  return Array.from({ length: count }, (_, i) => String(start + i));
}

export function parseDataPresentation(text: string | null | undefined): ParsedData | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  const head = clean.match(/^([A-Za-z ]+?)\s*:\s*(.+)$/);
  if (!head) return null;
  const kind = KIND_BY_PREFIX.find(([re]) => re.test(head[1]))?.[1];
  if (!kind) return null;
  const body = head[2].replace(/\.\s*$/, "");

  // 1) label=value pairs: "A=120, B=150" (the title is whatever precedes the first pair).
  const pairRe = /([^=,;:]+?)\s*=\s*(-?[\d.,]+\s*(?:k|K|%)?)/g;
  const pairs: { label: string; value: number }[] = [];
  let firstPairAt = -1;
  for (let m = pairRe.exec(body); m; m = pairRe.exec(body)) {
    const value = toNumber(m[2]);
    if (value === null) return null;
    if (firstPairAt < 0) firstPairAt = m.index;
    pairs.push({ label: m[1].replace(/^.*:\s*/, "").trim(), value });
  }
  if (pairs.length >= 2) {
    const titleSrc = body.slice(0, firstPairAt).replace(/[:\s]+$/, "");
    // The first label still has the title glued to it when the sentence has no colon before the pairs.
    const first = pairs[0].label;
    const title = titleSrc || "";
    const labels = pairs.map((p) => p.label);
    if (!titleSrc && first.includes(" ") && /\bof\b|\bin\b|\bper\b/i.test(first)) return null;
    return { kind, title: title || head[1], labels, series: [{ name: title || "Value", values: pairs.map((p) => p.value) }] };
  }

  // 2) named lists: "Math: 85,78,92; Science: 90,82,88" (each series is "Name: v,v,v").
  const parts = body.split(";").map((s) => s.trim()).filter(Boolean);
  const named: { name: string; values: number[] }[] = [];
  let title = "";
  for (let i = 0; i < parts.length; i++) {
    const segs = parts[i].split(/\.\s+/); // "Marks of 5 students. Math: 85,..." -> title + first series
    for (const seg of segs) {
      const m = seg.match(/^(.*?):\s*([-\d.,%kK\s]+)$/);
      if (!m) {
        if (i === 0 && !title) title = seg.replace(/[:\s]+$/, "");
        continue;
      }
      const values = splitList(m[2]).map(toNumber);
      if (values.length < 2 || values.some((v) => v === null)) continue;
      const name = m[1].trim();
      // First series' "name" may carry the title ("Marks of 5 students in Math and Science. Math").
      named.push({ name: name.split(/\.\s+/).pop() as string, values: values as number[] });
      if (!title && i === 0 && segs.length === 1 && named.length === 1) title = name;
    }
  }
  if (named.length === 0) return null;
  const count = named[0].values.length;
  if (named.some((s) => s.values.length !== count)) return null;

  let labels: string[] | null = null;
  const source = named.length === 1 ? named[0].name : title;
  labels = expandRange(source, count);
  if (!labels) {
    // Times/ordinals named in the title ("at 6am,12pm,6pm") label the points.
    const listed = source.match(/(?:at|in|for|on)\s+(.+)$/i);
    const items = listed ? splitList(listed[1]) : [];
    if (items.length === count) labels = items;
  }
  if (!labels) labels = Array.from({ length: count }, (_, i) => `${i + 1}`);
  const finalTitle = (named.length === 1 ? named[0].name : title) || head[1];
  return {
    kind,
    title: finalTitle,
    labels,
    series: named.length === 1 ? [{ name: finalTitle, values: named[0].values }] : named,
  };
}
