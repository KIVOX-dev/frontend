"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Brain, BookOpen, Table2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  correct_answer?: string;
  explanation?: string;
  data_presentation?: string;
};

// Matches the `category` enum test.model.js/test.validation.js accept on
// the backend — these are the 4 seeded open practice-bank tests (see
// scripts/seedPracticeTests.js), fetched from GET /tests instead of a
// static public/*.json file.
type Category = {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
  colorLight: string;
  gradient: string;
  description: string;
};

type BackendTest = {
  id: string;
  category?: string | null;
  description: string;
};

type TrendPoint = { date: string; percentage: number };
type CategoryTrend = { category: string; label: string; points: TrendPoint[] };

// Explicit hex pairs rather than the dashboard's --purple/--teal CSS vars —
// those are redefined elsewhere in legacy-portal.css to unrelated colors
// (--purple: a gray, --teal: a blue, both for button variants), so
// referencing them here would silently render the wrong color.
const CATEGORIES: Category[] = [
  {
    id: "quantitative",
    label: "Quantitative Aptitude",
    category: "quantitative",
    icon: BarChart3,
    color: "#2563EB",
    colorLight: "#EFF6FF",
    gradient: "linear-gradient(135deg, #60A5FA, #2563EB)",
    description: "Percentages, Ratios, Algebra, Geometry, Profit & Loss",
  },
  {
    id: "logical",
    label: "Logical Reasoning",
    category: "logical",
    icon: Brain,
    color: "#16A34A",
    colorLight: "#ECFDF5",
    gradient: "linear-gradient(135deg, #4ADE80, #16A34A)",
    description: "Puzzles, Series, Blood Relations, Coding-Decoding",
  },
  {
    id: "verbal",
    label: "Verbal Ability",
    category: "verbal",
    icon: BookOpen,
    color: "#7C3AED",
    colorLight: "#F5F3FF",
    gradient: "linear-gradient(135deg, #A78BFA, #7C3AED)",
    description: "Synonyms, Antonyms, Comprehension, Grammar",
  },
  {
    id: "data_interpretation",
    label: "Data Interpretation",
    category: "data_interpretation",
    icon: Table2,
    color: "#D97706",
    colorLight: "#FFFBEB",
    gradient: "linear-gradient(135deg, #FBBF24, #D97706)",
    description: "Tables, Bar Charts, Pie Charts, Line Graphs",
  },
];

// Resolve answer: some JSONs use "B" (option letter), some use the actual text
function resolveAnswer(q: Question): string {
  const raw = q.correct_answer || q.answer || "";
  // If answer is a single letter A-D, map to option index
  if (/^[A-D]$/i.test(raw.trim())) {
    const idx = raw.trim().toUpperCase().charCodeAt(0) - 65;
    return q.options[idx] ?? raw;
  }
  return raw;
}

const CHART_W = 240;
const CHART_H = 56;
const CHART_PAD_X = 6;

// Small accuracy-over-session line chart backing each category card's growth
// trend. Plain hand-drawn SVG rather than a charting library — nothing else
// in this codebase pulls one in, and a handful of points doesn't need one.
function TrendChart({ points, color }: { points: TrendPoint[]; color: string }) {
  if (points.length < 2) {
    return (
      <div style={{ height: CHART_H, display: "flex", alignItems: "center", fontSize: "12px", color: "var(--muted)" }}>
        {points.length === 0 ? "No attempts yet — practice once to start your trend." : "One more attempt unlocks your trend line."}
      </div>
    );
  }

  const usableW = CHART_W - CHART_PAD_X * 2;
  const coords = points.map((p, i) => {
    const x = CHART_PAD_X + (i / (points.length - 1)) * usableW;
    const y = CHART_H - 4 - (Math.min(100, Math.max(0, p.percentage)) / 100) * (CHART_H - 8);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const delta = points[points.length - 1].percentage - points[0].percentage;

  return (
    <div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} preserveAspectRatio="none">
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3 : 2} fill={color} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
        <span>{points.length} attempts</span>
        <span style={{ fontWeight: 700, color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
          {delta >= 0 ? "+" : ""}
          {delta}% since first attempt
        </span>
      </div>
    </div>
  );
}

export function PracticeModule() {
  const { user } = useAuthStore();

  // State
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // Every question's answer so far, keyed by index — same free-navigation
  // shape as the mock interview's written round (InterviewMcqRound.tsx) this mirrors:
  // no per-question reveal, jump anywhere via the palette, grade everything
  // together on Submit.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [sessionDone, setSessionDone] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  // Per-category stats persisted in localStorage
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; correct: number; sessions: number }>>({});
  // Real per-attempt history from the backend, keyed by category — unlike
  // categoryStats above (a device-local running total), this is what lets the
  // trend charts actually show accuracy changing across sessions over time.
  const [trends, setTrends] = useState<Record<string, TrendPoint[]>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("upscaler_ai_practice_stats");
      if (saved) setCategoryStats(JSON.parse(saved));
    } catch { /* noop */ }

    api
      .get<CategoryTrend[]>("/students/profile/practice-trends")
      .then((res) => {
        const byCategory: Record<string, TrendPoint[]> = {};
        for (const t of res.data) byCategory[t.category] = t.points;
        setTrends(byCategory);
      })
      .catch(console.error);
  }, []);

  const saveStats = useCallback((stats: typeof categoryStats) => {
    setCategoryStats(stats);
    localStorage.setItem("upscaler_ai_practice_stats", JSON.stringify(stats));
  }, []);

  const loadCategory = async (cat: Category) => {
    setLoading(true);
    setActiveCategory(cat);
    try {
      // GET /tests returns every test visible to this student — the 4 open
      // practice banks plus anything explicitly assigned to them (see
      // test.service.js#list). It's sorted newest-first and defaults to a
      // page of 20, so a student with 20+ assigned tests can push the
      // (older, seeded-once) practice-bank rows off page 1 entirely —
      // request the backend's max page size so all 4 are always included.
      const res = await api.get<BackendTest[]>("/tests", { params: { limit: 100 } });
      const match = res.data.find((t) => t.category === cat.category);
      if (!match) {
        toast.info("This practice category isn't available yet.", "Please check back later.");
        setActiveCategory(null);
        return;
      }
      setActiveTestId(match.id);
      const parsed = JSON.parse(match.description);
      const qs: Question[] = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      setAllQuestions(qs);
      startSession(qs, questionCount);
    } catch (err) {
      console.error("Failed to load questions:", err);
      toast.error("Failed to load question data.");
      setActiveCategory(null);
    } finally {
      setLoading(false);
    }
  };

  // 90s/question, same budget InterviewMcqRound.tsx uses for its timed written round.
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startSession = (pool: Question[], count: number) => {
    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));
    setSessionQuestions(picked);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswers({});
    setSessionDone(false);
    setTimeLeft(picked.length * 90);
    setTimerActive(true);
  };

  const handleSelect = (opt: string) => {
    setSelectedAnswer(opt);
    setAnswers(prev => ({ ...prev, [currentIdx]: opt }));
  };

  const handleNext = () => {
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(answers[currentIdx + 1] || null);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setSelectedAnswer(answers[currentIdx - 1] || null);
    }
  };

  const finishSession = useCallback(() => {
    setTimerActive(false);
    setSessionDone(true);

    if (!activeCategory) return;
    const finalCorrect = sessionQuestions.reduce((sum, q, idx) => sum + (answers[idx] === resolveAnswer(q) ? 1 : 0), 0);

    const prev = categoryStats[activeCategory.id] || { total: 0, correct: 0, sessions: 0 };
    saveStats({
      ...categoryStats,
      [activeCategory.id]: {
        total: prev.total + sessionQuestions.length,
        correct: prev.correct + finalCorrect,
        sessions: prev.sessions + 1,
      },
    });

    // Save to DB — the real /tests/submit endpoint (not the old
    // /students/:id/tests path, whose camelCase fields didn't match its
    // Joi schema and were silently dropped, so every practice attempt used
    // to log as a generic untitled "Practice Test").
    if (user?.id && activeTestId) {
      api.post("/tests/submit", {
        test_id: activeTestId,
        score: finalCorrect,
        max_score: sessionQuestions.length,
        percentage: Math.round((finalCorrect / sessionQuestions.length) * 100),
      }).catch((err) => {
        // Was a silent console.error before — a failure here means this
        // session's score never reaches the Dashboard/Growth Trends charts
        // even though the session-complete screen (driven entirely by local
        // scoring) shows a result either way, so it needs to be loud.
        console.error(err);
        toast.error("Your score was calculated, but saving it to your profile failed. Your trend charts may not reflect this session.");
      });
    }
  }, [activeCategory, activeTestId, answers, categoryStats, saveStats, sessionQuestions, user?.id]);

  // Auto-submit the instant every question has an answer — matches
  // InterviewMcqRound.tsx/AptitudeTests.tsx's timer-expiry auto-submit, just
  // triggered by completion instead of running out of time. Previously a
  // student who answered all 10 had to notice nothing happened and hunt for
  // Submit Test themselves.
  useEffect(() => {
    if (!timerActive || sessionQuestions.length === 0) return;
    if (Object.keys(answers).length === sessionQuestions.length) finishSession();
  }, [answers, sessionQuestions.length, timerActive, finishSession]);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          finishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, finishSession]);

  // ──── Session Complete Screen ────
  if (sessionDone && activeCategory) {
    const correct = sessionQuestions.reduce((sum, q, idx) => sum + (answers[idx] === resolveAnswer(q) ? 1 : 0), 0);
    const pct = Math.round((correct / sessionQuestions.length) * 100);
    return (
      <div className="screen active" style={{ padding: "40px" }}>
        <div className="card" style={{ maxWidth: "560px", margin: "0 auto", padding: "48px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: pct >= 70 ? "#dcfce7" : pct >= 40 ? "#fef3c7" : "#fee2e2", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626"} strokeWidth="2" width="36" height="36">
              {pct >= 70 ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> :
               <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>}
            </svg>
          </div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "8px", color: "var(--text)" }}>
            {pct >= 70 ? "Excellent Work! 🎉" : pct >= 40 ? "Good Effort! 💪" : "Keep Practicing! 📚"}
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "32px" }}>
            {activeCategory.label} — {sessionQuestions.length} Questions
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "36px" }}>
            <div>
              <div style={{ fontSize: "42px", fontWeight: 900, color: "var(--accent)" }}>{correct}</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>Correct</div>
            </div>
            <div style={{ width: "1px", background: "var(--border)" }}></div>
            <div>
              <div style={{ fontSize: "42px", fontWeight: 900, color: "var(--text)" }}>{sessionQuestions.length}</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>Total</div>
            </div>
            <div style={{ width: "1px", background: "var(--border)" }}></div>
            <div>
              <div style={{ fontSize: "42px", fontWeight: 900, color: pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626" }}>{pct}%</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>Accuracy</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button className="btn" onClick={() => { setActiveCategory(null); setSessionDone(false); }}>
              Back to Topics
            </button>
            <button className="btn btn-p" onClick={() => startSession(allQuestions, questionCount)}>
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──── Question Screen ────
  // Same layout as the mock interview's written round (InterviewMcqRound.tsx): a
  // timer + Submit Test in the header, free Previous/Next navigation, and a
  // Question Palette to jump to any question — no per-question reveal, all
  // questions get graded together on Submit.
  if (activeCategory && sessionQuestions.length > 0 && !loading) {
    const q = sessionQuestions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const progress = ((currentIdx + 1) / sessionQuestions.length) * 100;

    return (
      <div className="screen active" style={{ padding: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{activeCategory.label}</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>{answeredCount}/{sessionQuestions.length} answered</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "8px 16px", borderRadius: "8px", background: timeLeft < 120 ? "#fee2e2" : "var(--bg)", color: timeLeft < 120 ? "#dc2626" : "var(--text)", fontWeight: 700, fontSize: "16px", fontFamily: "monospace" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button className="btn btn-p" onClick={finishSession}>Submit Test</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", marginBottom: "28px", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: activeCategory.color, borderRadius: "3px", transition: "width 0.4s ease" }}></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "24px" }}>
          {/* Question */}
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Question {currentIdx + 1} of {sessionQuestions.length}</div>

            {q.data_presentation && (
              <div style={{ padding: "14px 18px", background: "var(--bg)", borderRadius: "10px", marginBottom: "20px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, borderLeft: `3px solid ${activeCategory.color}` }}>
                📊 {q.data_presentation}
              </div>
            )}

            <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "24px", lineHeight: 1.6 }}>{q.question}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "14px 18px",
                      background: isSelected ? activeCategory.colorLight : "var(--bg)",
                      border: isSelected ? `2px solid ${activeCategory.color}` : "2px solid var(--border)",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: isSelected ? activeCategory.color : "var(--text)",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: isSelected ? activeCategory.color : "var(--border)", color: isSelected ? "#fff" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                      {letter}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn" disabled={currentIdx === 0} onClick={handlePrev}>← Previous</button>
              <button className="btn btn-p" onClick={handleNext} disabled={currentIdx === sessionQuestions.length - 1}>
                Next →
              </button>
            </div>
          </div>

          {/* Question palette */}
          <div className="card" style={{ padding: "20px", height: "fit-content" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>Question Palette</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {sessionQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setSelectedAnswer(answers[idx] || null); }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: idx === currentIdx ? `2px solid ${activeCategory.color}` : "1px solid var(--border)",
                    background: answers[idx] ? activeCategory.colorLight : idx === currentIdx ? "var(--bg)" : "transparent",
                    color: answers[idx] ? activeCategory.color : "var(--text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: activeCategory.colorLight, border: `1px solid ${activeCategory.color}` }}></div>
                Answered
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "transparent", border: "1px solid var(--border)" }}></div>
                Not answered
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──── Category Selection Screen ────
  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Practice Module</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Pick a topic and sharpen your skills with real aptitude questions.</p>
      </div>

      {/* Question count selector */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Questions per session:</span>
        {[10, 20, 30, 50].map(n => (
          <button
            key={n}
            onClick={() => setQuestionCount(n)}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: questionCount === n ? "2px solid var(--accent)" : "2px solid var(--border)",
              background: questionCount === n ? "var(--accent-l)" : "var(--bg)",
              color: questionCount === n ? "var(--accent)" : "var(--text)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {n} Qs
          </button>
        ))}
      </div>

      {/* Category cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {CATEGORIES.map(cat => {
          const stats = categoryStats[cat.id];
          const accuracy = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              className="card"
              onClick={() => loadCategory(cat)}
              style={{
                padding: "28px",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s",
                borderLeft: `4px solid ${cat.color}`,
                borderRadius: "20px",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              {/* Decorative gradient blob, bottom-right — purely cosmetic, sits
                  behind every other element in the card. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: "-40px",
                  bottom: "-40px",
                  width: "140px",
                  height: "140px",
                  borderRadius: "50%",
                  background: cat.colorLight,
                  opacity: 0.8,
                  zIndex: 0,
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: cat.gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 16px -6px ${cat.color}66` }}>
                    <Icon size={26} strokeWidth={2} />
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: cat.colorLight, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ArrowRight size={18} strokeWidth={2.25} />
                  </div>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>{cat.label}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.5 }}>{cat.description}</p>
                {(stats || accuracy !== null) && (
                  <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "12px" }}>
                    {stats && <span>{stats.sessions} sessions</span>}
                    {stats && <span>{stats.total} questions</span>}
                    {accuracy !== null && (
                      <span style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: accuracy >= 70 ? "#dcfce7" : accuracy >= 40 ? "#fef3c7" : "#fee2e2", color: accuracy >= 70 ? "#15803d" : accuracy >= 40 ? "#92400e" : "#b91c1c" }}>
                        {accuracy}% avg
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <TrendChart points={trends[cat.category] || []} color={cat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading questions...</div>
      )}
    </div>
  );
}
