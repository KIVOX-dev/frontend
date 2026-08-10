// Pure helpers behind the MNC company-test question pools (see
// components/learner/MNCTestModule.tsx) — split out from that component so
// dedup/bounds logic can be unit tested without rendering React, and so the
// cross-file dedup fix (FE-003) and pool-bounds fix (FE-004) in
// FULL_STACK_AUDIT_REPORT.md live in one obviously-testable place.

export type MncQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  correct_answer?: string;
  explanation?: string;
  data_presentation?: string;
};

export type MncSection = { file: string; count: number };
export type MncTrack = { id: string; sections: MncSection[] };

/** Normalizes a question's text into a stable dedup key: trims, collapses
 * internal whitespace runs to a single space, and lowercases — so
 * "Foo   bar", "foo bar", and " Foo bar " all collide as the same question,
 * while genuinely different question text never does. */
export function normalizeQuestionKey(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Removes duplicate questions from `pool` by normalized question text,
 * checking (and updating) `seenKeys` rather than a key set scoped to just
 * this one pool.
 *
 * Passing the SAME Set across every file loaded in a session is what makes
 * this a cross-file dedup rather than a per-file one (FE-003): a question
 * already kept from an earlier file is dropped wherever else it reappears,
 * even in a completely different bank file — not just within the file it
 * first came from. Whichever file is deduped first keeps a shared question;
 * later files lose their copy. `seenKeys` is mutated in place so repeated
 * calls (one per file, as tracks are opened) keep accumulating correctly.
 */
export function dedupeQuestions<Q extends { question: string }>(pool: Q[], seenKeys: Set<string>): Q[] {
  const unique: Q[] = [];
  for (const q of pool) {
    const key = normalizeQuestionKey(q.question);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    unique.push(q);
  }
  return unique;
}

/** Running per-file offsets so every (track, file) pairing gets a disjoint
 * slice of that file's deduped pool, in `tracks` order — the same file used
 * by several tracks never hands out the same slice twice. */
export function computeSectionOffsets(tracks: MncTrack[]): Record<string, number> {
  const offsets: Record<string, number> = {};
  const runningByFile: Record<string, number> = {};
  for (const track of tracks) {
    for (const section of track.sections) {
      const used = runningByFile[section.file] || 0;
      offsets[`${track.id}:${section.file}`] = used;
      runningByFile[section.file] = used + section.count;
    }
  }
  return offsets;
}

export type PickResult<Q> = { questions: Q[]; shortBy: number };

/**
 * Slices `requested` questions out of `pool` starting at `offset` —
 * never fabricates missing ones (FE-004). If the pool doesn't have enough
 * left at that offset (e.g. because cross-file dedup shrank it, or a track
 * was configured to draw more than a file actually contains), this returns
 * however many are actually available and reports the shortfall via
 * `shortBy` instead of silently under-serving the caller.
 */
export function pickSectionQuestions<Q>(pool: Q[], offset: number, requested: number): PickResult<Q> {
  if (requested <= 0 || offset < 0 || offset >= pool.length) {
    return { questions: [], shortBy: Math.max(0, requested) };
  }
  const questions = pool.slice(offset, offset + requested);
  return { questions, shortBy: Math.max(0, requested - questions.length) };
}
