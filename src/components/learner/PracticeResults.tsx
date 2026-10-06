"use client";

import { useMemo, useRef, useState } from "react";
import { BarChart, DataPresentation, LineChart, PieChart } from "./DataPresentation";
import { parseDataPresentation, type ParsedData } from "@/lib/dataPresentation";

// Results screen for a Mock Practice session — the same idea as Round 1 of the
// mock interview (score, per-area breakdown, review), plus performance graphs
// and a full answer review with explanations and the original diagrams.

export type ResultItem = {
  question: string;
  options: string[];
  /** The correct option's text. */
  correct: string;
  /** The option the student picked, or null when left unanswered. */
  picked: string | null;
  explanation?: string;
  data_presentation?: string;
};

type Filter = "all" | "wrong" | "correct" | "unanswered";

const GREEN = "#16a34a";
const AMBER = "#d97706";
const RED = "#dc2626";
const GREY = "#94a3b8";
const tone = (p: number) => (p >= 70 ? GREEN : p >= 40 ? AMBER : RED);

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const KIND_LABEL: Record<string, string> = { bar: "Bar charts", line: "Line graphs", pie: "Pie charts", table: "Tables" };

function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 130 130" width="150" height="150" role="img" aria-label={`Score ${pct}%`}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={tone(pct)} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 65 65)" style={{ transition: "stroke-dasharray .8s ease" }} />
      <text x="65" y="63" textAnchor="middle" fontSize="28" fontWeight="800" fill={tone(pct)}>{pct}%</text>
      <text x="65" y="82" textAnchor="middle" fontSize="11" fill="var(--muted)">accuracy</text>
    </svg>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ flex: "1 1 110px", padding: "12px 14px", borderRadius: "12px", background: "var(--bg)" }}>
      <div style={{ fontSize: "22px", fontWeight: 800, color: color ?? "var(--text)" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function Panel({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{title}</div>
      {hint && <div style={{ fontSize: "12px", color: "var(--muted)", margin: "3px 0 10px" }}>{hint}</div>}
      <div style={{ marginTop: hint ? 0 : 12 }}>{children}</div>
    </div>
  );
}

export function PracticeResults({
  title,
  accent,
  items,
  timeUsedSeconds,
  timeBudgetSeconds,
  previousAttempts,
  onBack,
  onRetry,
  onRetryMissed,
}: {
  title: string;
  accent: string;
  items: ResultItem[];
  timeUsedSeconds: number;
  timeBudgetSeconds: number;
  /** Accuracy % of the student's earlier attempts in this category, oldest first. */
  previousAttempts: number[];
  onBack: () => void;
  onRetry: () => void;
  onRetryMissed?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const stats = useMemo(() => {
    const status = items.map((it) => (it.picked === null ? "unanswered" : it.picked === it.correct ? "correct" : "wrong") as Exclude<Filter, "all">);
    const count = (s: string) => status.filter((x) => x === s).length;
    const correct = count("correct");
    const answered = items.length - count("unanswered");
    return {
      status,
      correct,
      wrong: count("wrong"),
      unanswered: count("unanswered"),
      pct: Math.round((correct / items.length) * 100),
      attemptedAccuracy: answered ? Math.round((correct / answered) * 100) : 0,
    };
  }, [items]);

  // Data Interpretation only: accuracy by kind of diagram.
  const byKind = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    items.forEach((it, i) => {
      const kind = parseDataPresentation(it.data_presentation)?.kind;
      if (!kind) return;
      const row = map.get(kind) ?? { total: 0, correct: 0 };
      row.total += 1;
      if (stats.status[i] === "correct") row.correct += 1;
      map.set(kind, row);
    });
    return Array.from(map.entries()).map(([kind, r]) => ({ kind, ...r, pct: Math.round((r.correct / r.total) * 100) }));
  }, [items, stats.status]);

  const trendData: ParsedData = useMemo(() => {
    const values = [...previousAttempts.slice(-9), stats.pct];
    return { kind: "line", title: "", labels: values.map((_, i) => (i === values.length - 1 ? "Now" : `#${i + 1}`)), series: [{ name: "Accuracy %", values }] };
  }, [previousAttempts, stats.pct]);

  const donut: ParsedData = useMemo(() => {
    const rows = [
      ["Correct", stats.correct, GREEN],
      ["Wrong", stats.wrong, RED],
      ["Unanswered", stats.unanswered, GREY],
    ].filter(([, n]) => (n as number) > 0);
    return { kind: "pie", title: "", labels: rows.map((r) => r[0] as string), colors: rows.map((r) => r[2] as string), series: [{ name: "Answers", values: rows.map((r) => r[1] as number) }] };
  }, [stats]);

  const avgPrev = previousAttempts.length ? Math.round(previousAttempts.reduce((a, b) => a + b, 0) / previousAttempts.length) : null;
  const perQuestion = timeUsedSeconds / items.length;
  const insights: string[] = [];
  if (avgPrev !== null) {
    const d = stats.pct - avgPrev;
    insights.push(d === 0 ? `Same as your average of ${avgPrev}% across earlier attempts.` : `${d > 0 ? "Up" : "Down"} ${Math.abs(d)} points vs your ${avgPrev}% average across earlier attempts.`);
  } else insights.push("This is your first attempt here — future sessions will be compared against it.");
  if (byKind.length > 1) {
    const sorted = [...byKind].sort((a, b) => b.pct - a.pct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.pct !== worst.pct) insights.push(`Strongest on ${KIND_LABEL[best.kind].toLowerCase()} (${best.pct}%); practise ${KIND_LABEL[worst.kind].toLowerCase()} next (${worst.pct}%).`);
  }
  if (stats.unanswered > 0) insights.push(`${stats.unanswered} question${stats.unanswered === 1 ? " was" : "s were"} left unanswered — a quick guess beats a blank.`);
  insights.push(perQuestion < 30 ? `You averaged ${Math.round(perQuestion)}s per question — fast. Check you're not rushing.` : `You averaged ${Math.round(perQuestion)}s per question against a 90s budget.`);

  const visible = items.map((it, i) => ({ it, i })).filter(({ i }) => filter === "all" || stats.status[i] === filter);
  const jump = (i: number) => {
    setFilter("all");
    requestAnimationFrame(() => itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const tab = (f: Filter, label: string, n: number) => (
    <button key={f} onClick={() => setFilter(f)} className="btn" style={{ padding: "6px 14px", fontSize: "13px", background: filter === f ? accent : "transparent", color: filter === f ? "#fff" : "var(--text)", border: `1px solid ${filter === f ? accent : "var(--border)"}` }}>
      {label} ({n})
    </button>
  );

  return (
    <div className="screen active" style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: accent, letterSpacing: ".04em", textTransform: "uppercase" }}>Practice results</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn" onClick={onBack}>Back to Topics</button>
          {onRetryMissed && stats.wrong + stats.unanswered > 0 && (
            <button className="btn btn-o" onClick={onRetryMissed}>Retry {stats.wrong + stats.unanswered} missed</button>
          )}
          <button className="btn btn-p" onClick={onRetry}>Practice Again</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginTop: "22px", alignItems: "start" }}>
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
            <ScoreRing pct={stats.pct} />
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
                {stats.pct >= 70 ? "Excellent work 🎉" : stats.pct >= 40 ? "Good effort 💪" : "Keep practising 📚"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
                {stats.correct} of {items.length} correct{stats.unanswered < items.length && ` · ${stats.attemptedAccuracy}% of those you attempted`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
            <Stat label="Correct" value={stats.correct} color={GREEN} />
            <Stat label="Wrong" value={stats.wrong} color={RED} />
            <Stat label="Unanswered" value={stats.unanswered} color={GREY} />
            <Stat label="Time taken" value={clock(timeUsedSeconds)} />
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "5px" }}>
              <span>Time used</span>
              <span>{clock(timeUsedSeconds)} of {clock(timeBudgetSeconds)}</span>
            </div>
            <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (timeUsedSeconds / timeBudgetSeconds) * 100)}%`, height: "100%", background: accent, borderRadius: "4px" }} />
            </div>
          </div>
        </div>

        <Panel title="Answer breakdown">
          <PieChart data={donut} />
        </Panel>

        <Panel title="Question by question" hint="Click a square to jump to that question's review.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {items.map((_, i) => {
              const s = stats.status[i];
              const color = s === "correct" ? GREEN : s === "wrong" ? RED : GREY;
              return (
                <button key={i} onClick={() => jump(i)} aria-label={`Question ${i + 1}: ${s}`} title={`Question ${i + 1}: ${s}`} style={{ all: "unset", cursor: "pointer", width: 34, height: 34, borderRadius: 8, background: color, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Accuracy trend" hint={previousAttempts.length ? `Your last ${Math.min(previousAttempts.length, 9)} attempts and this one.` : undefined}>
          {previousAttempts.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>Complete one more session in this category to unlock your trend line.</div>
          ) : (
            <LineChart data={trendData} />
          )}
        </Panel>

        {byKind.length > 0 && (
          <Panel title="Accuracy by diagram type" hint="How you did on each kind of chart in this set.">
            <BarChart data={{ kind: "bar", title: "", labels: byKind.map((k) => KIND_LABEL[k.kind]), series: [{ name: "Accuracy %", values: byKind.map((k) => k.pct) }] }} />
          </Panel>
        )}

        <Panel title="What to focus on">
          <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "var(--text)", lineHeight: 1.55 }}>
            {insights.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Panel>
      </div>

      <div className="card" style={{ padding: "22px 24px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Answer review</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {tab("all", "All", items.length)}
            {tab("wrong", "Wrong", stats.wrong)}
            {tab("correct", "Correct", stats.correct)}
            {tab("unanswered", "Unanswered", stats.unanswered)}
          </div>
        </div>
        {visible.length === 0 && <div style={{ fontSize: "13px", color: "var(--muted)" }}>Nothing here.</div>}
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "18px" }}>
          {visible.map(({ it, i }) => {
            const s = stats.status[i];
            const badge = s === "correct" ? { t: "Correct", c: GREEN } : s === "wrong" ? { t: "Wrong", c: RED } : { t: "Unanswered", c: GREY };
            return (
              <li key={i} ref={(el) => { itemRefs.current[i] = el; }} style={{ padding: "18px 20px", border: "1px solid var(--border)", borderLeft: `4px solid ${badge.c}`, borderRadius: "12px", scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>Question {i + 1}</span>
                  <span style={{ color: badge.c }}>{badge.t}</span>
                </div>
                {it.data_presentation && <DataPresentation text={it.data_presentation} accent={accent} />}
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", lineHeight: 1.55, marginBottom: "12px" }}>{it.question}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {it.options.map((opt, oi) => {
                    const isCorrect = opt === it.correct;
                    const isPicked = opt === it.picked;
                    const color = isCorrect ? GREEN : isPicked ? RED : "var(--text)";
                    return (
                      <div key={oi} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", fontSize: "14px", color, background: isCorrect ? "#f0fdf4" : isPicked ? "#fef2f2" : "transparent", border: `1px solid ${isCorrect ? "#bbf7d0" : isPicked ? "#fecaca" : "var(--border)"}` }}>
                        <span style={{ fontWeight: 700, width: 18 }}>{String.fromCharCode(65 + oi)}</span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isCorrect && <span style={{ fontSize: "12px", fontWeight: 700 }}>Correct answer</span>}
                        {isPicked && !isCorrect && <span style={{ fontSize: "12px", fontWeight: 700 }}>Your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {it.explanation && (
                  <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--bg)", fontSize: "13.5px", lineHeight: 1.6, color: "var(--text)" }}>
                    <strong style={{ color: accent }}>Explanation · </strong>{it.explanation}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
