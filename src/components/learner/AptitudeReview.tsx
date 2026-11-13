"use client";

import { useMemo, useState } from "react";
import { useQuestionExplanations, type ExplanationState } from "@/lib/useQuestionExplanations";
import { DataPresentation } from "./DataPresentation";

export type ReviewItem = {
  question: { id: string | number; question: string; options: string[]; data_presentation?: string };
  selected: string | null;
  correct: string;
  isCorrect: boolean;
};

type Status = "correct" | "incorrect" | "unanswered";
type Filter = "all" | Status;

const TONE: Record<Status, { fg: string; bg: string; line: string; label: string }> = {
  correct: { fg: "#15803d", bg: "#f0fdf4", line: "#bbf7d0", label: "Correct" },
  incorrect: { fg: "#b91c1c", bg: "#fef2f2", line: "#fecaca", label: "Incorrect" },
  unanswered: { fg: "#475569", bg: "#f8fafc", line: "#e2e8f0", label: "Not answered" },
};

const Check = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>
);
const Cross = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
);

function statusOf(r: ReviewItem): Status {
  if (!r.selected) return "unanswered";
  return r.isCorrect ? "correct" : "incorrect";
}

function Explanation({ state, retry }: { state: ExplanationState | undefined; retry: () => void }) {
  const label: React.CSSProperties = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px" };
  let body: React.ReactNode;
  if (!state || state.status === "loading") {
    body = (
      <div aria-live="polite" aria-busy="true" style={{ display: "grid", gap: "6px" }}>
        <div className="ar-skel" style={{ width: "92%" }} />
        <div className="ar-skel" style={{ width: "68%" }} />
      </div>
    );
  } else if (state.status === "failed") {
    body = (
      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
        Explanation is unavailable right now.{" "}
        <button type="button" onClick={retry} style={{ all: "unset", cursor: "pointer", color: "var(--accent)", fontWeight: 600 }}>Retry</button>
      </div>
    );
  } else {
    body = (
      <>
        {state.disputed && (
          <div style={{ marginBottom: "8px", padding: "8px 10px", borderRadius: "6px", background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: "12.5px" }}>
            This question&apos;s answer key may be incorrect{state.suggestedAnswer ? ` — a likely answer is "${state.suggestedAnswer}"` : ""}. Please raise it with your instructor if you disagree with the marked answer.
          </div>
        )}
        <div style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--text)", whiteSpace: "pre-wrap" }}>{state.text}</div>
      </>
    );
  }
  return (
    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
      <div style={label}>Explanation</div>
      {body}
    </div>
  );
}

export function AptitudeReview({
  title,
  review,
  score,
  onBackToResult,
  onBackToTests,
}: {
  title: string;
  review: ReviewItem[];
  score: number;
  onBackToResult: () => void;
  onBackToTests: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(
    () => review.map((r) => ({ question: r.question.question, options: r.question.options, correct: r.correct, data_presentation: r.question.data_presentation })),
    [review]
  );
  const { explanations, retry } = useQuestionExplanations(items);

  const total = review.length;
  const counts = useMemo(() => {
    const c = { correct: 0, incorrect: 0, unanswered: 0 };
    review.forEach((r) => { c[statusOf(r)] += 1; });
    return c;
  }, [review]);
  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const shown = review.map((r, i) => ({ r, i })).filter(({ r }) => filter === "all" || statusOf(r) === filter);

  const stat = (value: string, label: string, color?: string) => (
    <div className="ar-stat">
      <div className="ar-stat-v" style={color ? { color } : undefined}>{value}</div>
      <div className="ar-stat-l">{label}</div>
    </div>
  );
  const tab = (f: Filter, text: string, n: number) => (
    <button key={f} type="button" className="ar-tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
      {text} <span className="ar-tab-n">{n}</span>
    </button>
  );

  return (
    <div className="screen active ar-root">
      <style>{`
        .ar-root { padding: 0 24px 48px !important; }
        .ar-wrap { max-width: 820px; margin: 0 auto; }
        .ar-bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; background: var(--card, #fff); border-bottom: 1px solid var(--border); }
        .ar-bar-actions { display: flex; gap: 8px; }
        .ar-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 22px 0 4px; }
        .ar-title { font-size: 22px; font-weight: 700; color: var(--text); margin: 0 0 16px; letter-spacing: -0.01em; }
        .ar-stats { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--card, #fff); }
        .ar-stat { padding: 14px 16px; border-right: 1px solid var(--border); }
        .ar-stat:last-child { border-right: 0; }
        .ar-stat-v { font-size: 22px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; line-height: 1.1; }
        .ar-stat-l { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .ar-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 20px 0 14px; }
        .ar-tab { cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--muted); background: transparent; border: 1px solid var(--border); }
        .ar-tab[aria-pressed="true"] { color: var(--text); background: var(--bg); border-color: var(--muted); }
        .ar-tab-n { margin-left: 4px; font-weight: 500; font-variant-numeric: tabular-nums; opacity: 0.8; }
        .ar-q { border: 1px solid var(--border); border-radius: 10px; background: var(--card, #fff); padding: 18px 20px; margin-bottom: 12px; }
        .ar-q-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .ar-q-num { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
        .ar-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid; }
        .ar-qtext { font-size: 15.5px; font-weight: 600; color: var(--text); line-height: 1.5; margin: 0 0 14px; }
        .ar-opt { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text); margin-bottom: 6px; }
        .ar-opt-l { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--bg); color: var(--muted); }
        .ar-opt-t { flex: 1; min-width: 0; overflow-wrap: anywhere; }
        .ar-opt-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .ar-skel { height: 11px; border-radius: 4px; background: linear-gradient(90deg, var(--bg), var(--border), var(--bg)); background-size: 200% 100%; animation: ar-shimmer 1.4s infinite linear; }
        @keyframes ar-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @media (max-width: 860px) {
          .ar-root { padding: 0 12px 32px !important; }
          .ar-bar .btn { padding: 7px 12px; font-size: 13px; }
          .ar-bar-actions { flex: 1; justify-content: flex-end; }
          .ar-title { font-size: 19px; }
          .ar-stats { grid-template-columns: repeat(3, 1fr); }
          .ar-stat { border-bottom: 1px solid var(--border); padding: 12px; }
          .ar-stat:nth-child(3) { border-right: 0; }
          .ar-stat:nth-child(n+4) { border-bottom: 0; }
          .ar-q { padding: 14px; }
          .ar-opt { padding: 9px 10px; gap: 10px; }
          .ar-opt-tag span.ar-tag-text { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .ar-skel { animation: none; } }
      `}</style>
      <div className="ar-wrap">
        <div className="ar-bar">
          <button className="btn btn-o" onClick={onBackToResult}>← Result</button>
          <div className="ar-bar-actions">
            <button className="btn btn-p" onClick={onBackToTests}>Back to Tests</button>
          </div>
        </div>

        <div className="ar-eyebrow">Answer review</div>
        <h2 className="ar-title">{title}</h2>

        <div className="ar-stats">
          {stat(`${score}/${total}`, "Score")}
          {stat(`${accuracy}%`, "Accuracy")}
          {stat(String(counts.correct), "Correct", TONE.correct.fg)}
          {stat(String(counts.incorrect), "Incorrect", TONE.incorrect.fg)}
          {stat(String(counts.unanswered), "Not answered")}
        </div>

        <div className="ar-tabs" role="group" aria-label="Filter questions">
          {tab("all", "All", total)}
          {tab("incorrect", "Incorrect", counts.incorrect)}
          {tab("unanswered", "Not answered", counts.unanswered)}
          {tab("correct", "Correct", counts.correct)}
        </div>

        {shown.length === 0 && <div style={{ padding: "24px 0", color: "var(--muted)", fontSize: "14px" }}>No questions in this category.</div>}

        {shown.map(({ r, i }) => {
          const st = statusOf(r);
          const tone = TONE[st];
          return (
            <article key={String(r.question.id)} className="ar-q" style={{ borderLeft: `3px solid ${tone.fg}` }}>
              <div className="ar-q-head">
                <span className="ar-q-num">Question {i + 1}</span>
                <span className="ar-chip" style={{ color: tone.fg, background: tone.bg, borderColor: tone.line }}>
                  {st === "correct" ? <Check /> : st === "incorrect" ? <Cross /> : null}
                  {tone.label}
                </span>
              </div>
              {r.question.data_presentation && <DataPresentation text={r.question.data_presentation} />}
              <h3 className="ar-qtext">{r.question.question}</h3>
              <div>
                {r.question.options.map((opt, oi) => {
                  const isCorrect = opt === r.correct;
                  const isPick = opt === r.selected;
                  const wrongPick = isPick && !isCorrect;
                  const t = isCorrect ? TONE.correct : wrongPick ? TONE.incorrect : null;
                  return (
                    <div key={opt + oi} className="ar-opt" style={t ? { background: t.bg, borderColor: t.line, color: t.fg, fontWeight: 600 } : undefined}>
                      <span className="ar-opt-l" style={t ? { background: t.fg, color: "#fff" } : undefined}>{String.fromCharCode(65 + oi)}</span>
                      <span className="ar-opt-t">{opt}</span>
                      {(isCorrect || isPick) && (
                        <span className="ar-opt-tag">
                          {isCorrect ? <Check /> : <Cross />}
                          <span className="ar-tag-text">
                            {isCorrect && isPick ? "Your answer · Correct" : isCorrect ? "Correct answer" : "Your answer"}
                          </span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <Explanation state={explanations[i]} retry={retry} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
