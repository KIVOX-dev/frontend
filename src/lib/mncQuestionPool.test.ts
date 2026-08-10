import { describe, it, expect } from "vitest";
import {
  normalizeQuestionKey,
  dedupeQuestions,
  computeSectionOffsets,
  pickSectionQuestions,
  type MncQuestion,
} from "./mncQuestionPool";

function q(id: number, question: string): MncQuestion {
  return { id, question, options: ["A", "B", "C", "D"], answer: "A" };
}

describe("normalizeQuestionKey", () => {
  it("collapses internal whitespace runs", () => {
    expect(normalizeQuestionKey("What   is  2+2?")).toBe(normalizeQuestionKey("What is 2+2?"));
  });

  it("is case-insensitive", () => {
    expect(normalizeQuestionKey("What is 2+2?")).toBe(normalizeQuestionKey("WHAT IS 2+2?"));
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeQuestionKey("  What is 2+2?  ")).toBe(normalizeQuestionKey("What is 2+2?"));
  });
});

describe("dedupeQuestions", () => {
  it("removes an exact duplicate within a single file's pool", () => {
    const pool = [q(1, "What is 2+2?"), q(2, "What is 2+2?"), q(3, "What is 3+3?")];
    const result = dedupeQuestions(pool, new Set());
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it("removes a duplicate across two different files sharing one seenKeys Set (cross-file dedup, FE-003)", () => {
    const fileA = [q(1, "What is 2+2?"), q(2, "What is 3+3?")];
    const fileB = [q(3, "What is 2+2?"), q(4, "What is 4+4?")];
    const seen = new Set<string>();

    const fromA = dedupeQuestions(fileA, seen);
    const fromB = dedupeQuestions(fileB, seen);

    expect(fromA.map((r) => r.id)).toEqual([1, 2]);
    // id 3 ("What is 2+2?") is dropped — already kept from file A.
    expect(fromB.map((r) => r.id)).toEqual([4]);
  });

  it("treats whitespace differences as the same question", () => {
    const pool = [q(1, "What   is 2+2?"), q(2, "What is 2+2?")];
    const result = dedupeQuestions(pool, new Set());
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it("treats capitalization differences as the same question", () => {
    const pool = [q(1, "what is 2+2?"), q(2, "WHAT IS 2+2?")];
    const result = dedupeQuestions(pool, new Set());
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it("keeps genuinely different questions", () => {
    const pool = [q(1, "What is 2+2?"), q(2, "What is 5+5?")];
    const result = dedupeQuestions(pool, new Set());
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it("keeps rows with duplicate ids if their question text differs (dedup key is text, not id)", () => {
    const pool = [
      { ...q(1, "What is 2+2?") },
      { ...q(1, "What is 3+3?") }, // same id, different question
    ];
    const result = dedupeQuestions(pool, new Set());
    expect(result).toHaveLength(2);
  });

  it("drops rows with a missing/empty question string as duplicates of each other", () => {
    const pool = [q(1, ""), q(2, ""), q(3, "What is 2+2?")];
    const result = dedupeQuestions(pool, new Set());
    // Both empty-question rows normalize to the same "" key — only the first survives.
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });
});

describe("computeSectionOffsets", () => {
  it("gives each track a disjoint slice of a file shared across tracks", () => {
    const tracks = [
      { id: "tcs", sections: [{ file: "quant.json", count: 10 }] },
      { id: "infosys", sections: [{ file: "quant.json", count: 12 }] },
    ];
    const offsets = computeSectionOffsets(tracks);
    expect(offsets["tcs:quant.json"]).toBe(0);
    expect(offsets["infosys:quant.json"]).toBe(10);
  });

  it("tracks offsets independently per file", () => {
    const tracks = [
      { id: "tcs", sections: [{ file: "quant.json", count: 10 }, { file: "verbal.json", count: 5 }] },
      { id: "infosys", sections: [{ file: "quant.json", count: 12 }] },
    ];
    const offsets = computeSectionOffsets(tracks);
    expect(offsets["tcs:verbal.json"]).toBe(0);
    expect(offsets["infosys:quant.json"]).toBe(10);
  });
});

describe("pickSectionQuestions (FE-004 bounds protection)", () => {
  const pool = Array.from({ length: 10 }, (_, i) => q(i, `Question ${i}`));

  it("returns the exact requested count with no shortfall when the pool has enough", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 0, 5);
    expect(questions).toHaveLength(5);
    expect(shortBy).toBe(0);
  });

  it("reports the shortfall instead of silently returning fewer questions (requested > available)", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 8, 5);
    expect(questions).toHaveLength(2); // only indices 8,9 remain
    expect(shortBy).toBe(3);
  });

  it("handles a pool with 0 available questions", () => {
    const { questions, shortBy } = pickSectionQuestions([], 0, 5);
    expect(questions).toHaveLength(0);
    expect(shortBy).toBe(5);
  });

  it("handles a pool with exactly 1 available question", () => {
    const { questions, shortBy } = pickSectionQuestions([q(0, "Only one")], 0, 1);
    expect(questions).toHaveLength(1);
    expect(shortBy).toBe(0);
  });

  it("handles requested = 0", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 0, 0);
    expect(questions).toHaveLength(0);
    expect(shortBy).toBe(0);
  });

  it("handles requested = available exactly", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 0, 10);
    expect(questions).toHaveLength(10);
    expect(shortBy).toBe(0);
  });

  it("handles an offset already past the end of the pool", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 10, 5);
    expect(questions).toHaveLength(0);
    expect(shortBy).toBe(5);
  });

  it("handles a large requested count far exceeding the pool", () => {
    const { questions, shortBy } = pickSectionQuestions(pool, 0, 1000);
    expect(questions).toHaveLength(10);
    expect(shortBy).toBe(990);
  });

  it("never fabricates questions — returned items are always a subset of the pool", () => {
    const { questions } = pickSectionQuestions(pool, 3, 50);
    for (const item of questions) {
      expect(pool).toContainEqual(item);
    }
  });
});
