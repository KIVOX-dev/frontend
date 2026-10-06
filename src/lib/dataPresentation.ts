// Turns the one-line text a Data Interpretation question carries
// ("Bar chart: Sales of A, B, C in 2019: A=120, B=150, C=90.") into structured
// data a chart/table component can draw. Returns null for anything it can't
// read with confidence, so the caller shows the original text instead of a
// wrong picture.

export type DataKind = "bar" | "line" | "pie" | "table";

export interface ParsedData {
  kind: DataKind;
  title: string;
  /** Category labels (x-axis / rows). */
  labels: string[];
  /** One entry per data series; a single-series chart has exactly one. */
  series: { name: string; values: number[] }[];
  /** Optional per-slice colours (pie) — set by callers building ParsedData by hand. */
  colors?: string[];
  /** Tables only: show each series as a row (labels become the columns). */
  seriesAsRows?: boolean;
}

const KIND_BY_PREFIX: [RegExp, DataKind][] = [
  [/^bar\s*(chart|graph)/i, "bar"],
  [/^line\s*(chart|graph)/i, "line"],
  [/^pie\s*(chart|graph)/i, "pie"],
  [/^table/i, "table"],
];

// 1,200 | 1200 | 45.5 — with an optional k / % suffix. Units are dropped on
// purpose: every value in a series shares one, and a chart only needs proportion.
const NUM = String.raw`-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:[kK%]|[a-zA-Z°]{1,4})?`;
const NUM_ONLY = new RegExp(`^${NUM}$`);
const PAIR = new RegExp(String.raw`([^=,;:]+?)\s*=\s*(${NUM})(?=\s*(?:,|;|$))`, "g");

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").replace(/[^\d.]+$/, ""));
}

// Bare lists are plain comma-separated ("100,105,102"); thousands separators only occur in label=value pairs.
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const tidy = (s: string) => s.replace(/[:\s]+$/, "").replace(/^[:\s]+/, "");

interface Chunk {
  prefix: string;
  pairs?: { label: string; value: number }[];
  values?: number[];
}

function parseChunk(chunk: string): Chunk | null {
  const pairs: { label: string; value: number }[] = [];
  let firstAt = -1;
  PAIR.lastIndex = 0;
  for (let m = PAIR.exec(chunk); m; m = PAIR.exec(chunk)) {
    if (firstAt < 0) firstAt = m.index;
    pairs.push({ label: m[1].trim(), value: toNumber(m[2]) });
  }
  if (pairs.length >= 2) return { prefix: tidy(chunk.slice(0, firstAt)), pairs };

  // Bare list "Title: 800,1000,900": the values follow the last colon.
  const colon = chunk.lastIndexOf(":");
  if (colon < 0) return null;
  const items = splitList(chunk.slice(colon + 1));
  if (items.length >= 2 && items.every((i) => NUM_ONLY.test(i))) return { prefix: tidy(chunk.slice(0, colon)), values: items.map(toNumber) };
  return null;
}

/** "2015-2020" with 6 points -> 2015..2020. */
function expandRange(text: string, count: number): string[] | null {
  const m = text.match(/(\d{4})\s*(?:-|–|to)\s*(\d{4})/i);
  if (!m) return null;
  const start = Number(m[1]);
  return Number(m[2]) - start + 1 === count ? Array.from({ length: count }, (_, i) => String(start + i)) : null;
}

/** Labels for an unlabelled list of values: a year range, or "at 6am,12pm,6pm" in the title. */
function inferLabels(title: string, count: number): string[] {
  const range = expandRange(title, count);
  if (range) return range;
  const listed = title.match(/\b(?:at|in|for|on)\s+(.+)$/i);
  const items = listed ? splitList(listed[1]) : [];
  return items.length === count ? items : Array.from({ length: count }, (_, i) => String(i + 1));
}

export function parseDataPresentation(text: string | null | undefined): ParsedData | null {
  if (!text) return null;
  const head = text.replace(/\s+/g, " ").trim().match(/^([A-Za-z ]+?)\s*:\s*(.+)$/);
  if (!head) return null;
  const kind = KIND_BY_PREFIX.find(([re]) => re.test(head[1]))?.[1];
  if (!kind) return null;

  const chunks = head[2].replace(/\.\s*$/, "").split(/\s*;\s*/).map(parseChunk);
  if (chunks.length === 0 || chunks.some((c) => c === null)) return null;
  const parsed = chunks as Chunk[];

  // One chunk: a single series, either label=value pairs or a bare list.
  if (parsed.length === 1) {
    const [c] = parsed;
    if (c.pairs) {
      return { kind, title: c.prefix, labels: c.pairs.map((p) => p.label), series: [{ name: c.prefix || "Value", values: c.pairs.map((p) => p.value) }] };
    }
    const values = c.values as number[];
    return { kind, title: c.prefix, labels: inferLabels(c.prefix, values.length), series: [{ name: c.prefix || "Value", values }] };
  }

  // Several chunks, each "Name: v,v,v" — one series per chunk. The first chunk's
  // prefix may carry the title ("Marks of 5 students. Math"): title, then series name.
  if (parsed.every((c) => c.values)) {
    const count = (parsed[0].values as number[]).length;
    if (parsed.some((c) => (c.values as number[]).length !== count)) return null;
    const first = parsed[0].prefix.split(/\.\s+/);
    const title = first.length > 1 ? first.slice(0, -1).join(". ") : "";
    const series = parsed.map((c, i) => ({ name: i === 0 ? first[first.length - 1] : c.prefix, values: c.values as number[] }));
    return { kind, title, labels: inferLabels(title, count), series };
  }

  // Several chunks, each "Row: label=v, label=v" — a matrix: one series per row.
  if (parsed.every((c) => c.pairs)) {
    const labels = (parsed[0].pairs as { label: string }[]).map((p) => p.label);
    const same = parsed.every((c) => (c.pairs as { label: string }[]).map((p) => p.label).join("|") === labels.join("|"));
    if (!same) return null;
    const rowName = (prefix: string) => prefix.split(/:\s*/).pop() as string;
    const firstParts = parsed[0].prefix.split(/:\s*/);
    const title = firstParts.length > 1 ? firstParts.slice(0, -1).join(": ") : "";
    return {
      kind,
      title,
      labels,
      seriesAsRows: true,
      series: parsed.map((c, i) => ({ name: i === 0 ? rowName(parsed[0].prefix) : rowName(c.prefix), values: (c.pairs as { value: number }[]).map((p) => p.value) })),
    };
  }
  return null;
}
