// Each company's written-test pattern, and the offline question banks that
// stand in for it. Used by the mock interview's MCQ round (Round 1) when the
// AI service can't generate a role- and company-specific set: the student
// still gets that company's section mix, just without the role-specific
// Technical section. (Formerly the standalone MNC Test screen.)

import { type MncQuestion, dedupeQuestions } from "@/lib/mncQuestionPool";

export type McqQuestion = {
  id: number;
  section: string;
  question: string;
  options: string[];
  correct_answer: string;
  /** Data the question refers to (Data Interpretation charts, as text). */
  context?: string;
};

type Section = { label: string; file: string; count: number };

const QUANT = "/quantitative_mcq.json";
const LOGICAL = "/logical_mcq_500.json";
const VERBAL = "/verbal_json_20260418_40a84d.json";
const DI = "/datainterpretation_json_20260418_efaa7a.json";

// Keyed by lower-cased company name, as picked in the interview setup.
const PATTERNS: Record<string, { test: string; sections: Section[] }> = {
  tcs: {
    test: "TCS NQT",
    sections: [
      { label: "Quantitative", file: QUANT, count: 10 },
      { label: "Logical", file: LOGICAL, count: 10 },
      { label: "Verbal", file: VERBAL, count: 5 },
    ],
  },
  infosys: {
    test: "Infosys InfyTQ",
    sections: [
      { label: "Quantitative", file: QUANT, count: 12 },
      { label: "Logical", file: LOGICAL, count: 8 },
      { label: "Verbal", file: VERBAL, count: 5 },
    ],
  },
  wipro: {
    test: "Wipro NLTH",
    sections: [
      { label: "Quantitative", file: QUANT, count: 15 },
      { label: "Verbal", file: VERBAL, count: 10 },
    ],
  },
  cognizant: {
    test: "Cognizant GenC",
    sections: [
      { label: "Analytical", file: QUANT, count: 8 },
      { label: "Logical", file: LOGICAL, count: 8 },
      { label: "Verbal", file: VERBAL, count: 8 },
      { label: "Data Interpretation", file: DI, count: 6 },
    ],
  },
  accenture: {
    test: "Accenture Cognitive Assessment",
    sections: [
      { label: "Cognitive", file: LOGICAL, count: 10 },
      { label: "Quantitative", file: QUANT, count: 10 },
      { label: "English", file: VERBAL, count: 5 },
    ],
  },
  zoho: {
    test: "Zoho Written Round",
    sections: [
      { label: "Problem Solving", file: QUANT, count: 15 },
      { label: "Logical", file: LOGICAL, count: 10 },
      { label: "Data Interpretation", file: DI, count: 5 },
    ],
  },
};

// Any other company gets a generic campus aptitude pattern.
const DEFAULT_PATTERN = {
  test: "Campus Aptitude Test",
  sections: [
    { label: "Quantitative", file: QUANT, count: 8 },
    { label: "Logical", file: LOGICAL, count: 7 },
    { label: "Verbal", file: VERBAL, count: 5 },
  ],
};

export function companyPattern(company: string) {
  return PATTERNS[company.trim().toLowerCase()] ?? DEFAULT_PATTERN;
}

/** The pattern's name, e.g. "TCS NQT", for headings. */
export function companyTestName(company: string) {
  return PATTERNS[company.trim().toLowerCase()] ? companyPattern(company).test : `${company} written test`;
}

// Shuffled, deduped pool per bank file, cached for the session.
const seen = new Set<string>();
const pools: Record<string, Promise<MncQuestion[]>> = {};

function loadPool(file: string) {
  pools[file] ??= fetch(file)
    .then((r) => {
      if (!r.ok) throw new Error(`${file}: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const raw: MncQuestion[] = Array.isArray(data) ? data : data.questions || [];
      const pool = dedupeQuestions(raw, seen);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool;
    });
  return pools[file];
}

// Banks store the answer either as the option text or as a letter ("B").
function resolveAnswer(q: MncQuestion) {
  const raw = (q.correct_answer || q.answer || "").trim();
  if (/^[A-D]$/i.test(raw)) return q.options[raw.toUpperCase().charCodeAt(0) - 65] ?? raw;
  return raw;
}

// Where each (file) pool has been read up to, so a retake in the same
// session gets fresh questions instead of the same slice again.
const cursor: Record<string, number> = {};

/** The company's pattern drawn from the offline banks. Never pads: if a bank runs short, fewer come back. */
export async function loadCompanyBankQuestions(company: string): Promise<McqQuestion[]> {
  const out: McqQuestion[] = [];
  for (const s of companyPattern(company).sections) {
    const pool = await loadPool(s.file);
    let at = cursor[s.file] ?? 0;
    if (at + s.count > pool.length) at = 0; // wrap once exhausted
    const picked = pool.slice(at, at + s.count);
    cursor[s.file] = at + picked.length;
    for (const q of picked) {
      const answer = resolveAnswer(q);
      if (q.options?.length !== 4 || !q.options.includes(answer)) continue;
      out.push({
        id: out.length + 1,
        section: s.label,
        question: q.question,
        options: q.options,
        correct_answer: answer,
        context: q.data_presentation,
      });
    }
  }
  return out;
}
