"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  correct_answer?: string;
  explanation?: string;
  data_presentation?: string;
};

type Category = {
  id: string;
  label: string;
  file: string;
  icon: React.ReactNode;
  color: string;
  colorLight: string;
  description: string;
};

const CATEGORIES: Category[] = [
  {
    id: "quantitative",
    label: "Quantitative Aptitude",
    file: "/quantitative_mcq.json",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: "var(--accent)",
    colorLight: "var(--accent-l)",
    description: "Percentages, Ratios, Algebra, Geometry, Profit & Loss",
  },
  {
    id: "logical",
    label: "Logical Reasoning",
    file: "/logical_mcq_500.json",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: "var(--purple, #7c3aed)",
    colorLight: "var(--purple-l, #ede9fe)",
    description: "Puzzles, Series, Blood Relations, Coding-Decoding",
  },
  {
    id: "verbal",
    label: "Verbal Ability",
    file: "/verbal_json_20260418_40a84d.json",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    color: "var(--teal, #0d9488)",
    colorLight: "var(--teal-l, #ccfbf1)",
    description: "Synonyms, Antonyms, Comprehension, Grammar",
  },
  {
    id: "di",
    label: "Data Interpretation",
    file: "/datainterpretation_json_20260418_efaa7a.json",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    color: "var(--amber, #d97706)",
    colorLight: "var(--amber-l, #fef3c7)",
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

export function PracticeModule() {
  const { user } = useAuthStore();

  // State
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  // Session stats
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  // Per-category stats persisted in localStorage
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; correct: number; sessions: number }>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("skillovate_practice_stats");
      if (saved) setCategoryStats(JSON.parse(saved));
    } catch { /* noop */ }
  }, []);

  const saveStats = useCallback((stats: typeof categoryStats) => {
    setCategoryStats(stats);
    localStorage.setItem("skillovate_practice_stats", JSON.stringify(stats));
  }, []);

  const loadCategory = async (cat: Category) => {
    setLoading(true);
    setActiveCategory(cat);
    try {
      const res = await fetch(cat.file);
      const data = await res.json();
      const qs: Question[] = Array.isArray(data) ? data : (data.questions || []);
      setAllQuestions(qs);
      startSession(qs, questionCount);
    } catch (err) {
      console.error("Failed to load questions:", err);
      alert("Failed to load question data.");
      setActiveCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const startSession = (pool: Question[], count: number) => {
    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSessionQuestions(shuffled.slice(0, Math.min(count, shuffled.length)));
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCorrect(0);
    setAttempted(0);
    setSessionDone(false);
  };

  const handleSelect = (opt: string) => {
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(opt);
    setAttempted(prev => prev + 1);

    const correctAnswer = resolveAnswer(sessionQuestions[currentIdx]);
    if (opt === correctAnswer) {
      setCorrect(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Session complete
      setSessionDone(true);
      if (activeCategory) {
        const prev = categoryStats[activeCategory.id] || { total: 0, correct: 0, sessions: 0 };
        const updated = {
          ...categoryStats,
          [activeCategory.id]: {
            total: prev.total + attempted + (selectedAnswer ? 0 : 0),
            correct: prev.correct + correct + (selectedAnswer === resolveAnswer(sessionQuestions[currentIdx]) ? 0 : 0),
            sessions: prev.sessions + 1,
          },
        };
        // Recalculate with the final answer
        const finalCorrect = correct + (selectedAnswer === resolveAnswer(sessionQuestions[currentIdx]) ? 0 : 0);
        updated[activeCategory.id] = {
          total: prev.total + sessionQuestions.length,
          correct: prev.correct + (finalCorrect),
          sessions: prev.sessions + 1,
        };
        saveStats(updated);

        // Save to DB
        if (user?.id) {
          import("@/lib/api").then(({ api }) => {
            api.post(`/students/${user.id}/tests`, {
              score: finalCorrect,
              total: sessionQuestions.length,
              percentage: Math.round((finalCorrect / sessionQuestions.length) * 100),
              testName: `${activeCategory.label} Practice`,
              type: "practice"
            }).catch(console.error);
          });
        }
      }
    }
  };

  // ──── Session Complete Screen ────
  if (sessionDone && activeCategory) {
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
  if (activeCategory && sessionQuestions.length > 0 && !loading) {
    const q = sessionQuestions[currentIdx];
    const correctAnswer = resolveAnswer(q);
    const progress = ((currentIdx + 1) / sessionQuestions.length) * 100;

    return (
      <div className="screen active" style={{ padding: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{activeCategory.label}</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Question {currentIdx + 1} of {sessionQuestions.length} · {correct}/{attempted} correct</p>
          </div>
          <button className="btn" onClick={() => { setActiveCategory(null); setSessionDone(false); }}>Exit Practice</button>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", marginBottom: "28px", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: activeCategory.color, borderRadius: "3px", transition: "width 0.4s ease" }}></div>
        </div>

        <div className="card" style={{ padding: "36px", maxWidth: "800px", margin: "0 auto" }}>
          {/* Data presentation for DI questions */}
          {q.data_presentation && (
            <div style={{ padding: "16px 20px", background: "var(--bg)", borderRadius: "12px", marginBottom: "24px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, borderLeft: `4px solid ${activeCategory.color}` }}>
              📊 {q.data_presentation}
            </div>
          )}

          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "28px", lineHeight: 1.6 }}>
            {q.question}
          </h3>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              let bg = "var(--bg)";
              let border = "2px solid var(--border)";
              let textColor = "var(--text)";

              if (showExplanation) {
                if (opt === correctAnswer) {
                  bg = "#dcfce7";
                  border = "2px solid #16a34a";
                  textColor = "#15803d";
                } else if (opt === selectedAnswer && opt !== correctAnswer) {
                  bg = "#fee2e2";
                  border = "2px solid #dc2626";
                  textColor = "#b91c1c";
                }
              } else if (selectedAnswer === opt) {
                bg = activeCategory.colorLight;
                border = `2px solid ${activeCategory.color}`;
                textColor = activeCategory.color;
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selectedAnswer}
                  style={{
                    padding: "16px 20px",
                    background: bg,
                    border,
                    borderRadius: "12px",
                    textAlign: "left",
                    cursor: selectedAnswer ? "default" : "pointer",
                    fontWeight: 500,
                    color: textColor,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    opacity: showExplanation && opt !== correctAnswer && opt !== selectedAnswer ? 0.5 : 1,
                  }}
                >
                  <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: showExplanation && opt === correctAnswer ? "#16a34a" : showExplanation && opt === selectedAnswer ? "#dc2626" : "var(--border)", color: showExplanation && (opt === correctAnswer || opt === selectedAnswer) ? "#fff" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                    {showExplanation && opt === correctAnswer ? "✓" : showExplanation && opt === selectedAnswer && opt !== correctAnswer ? "✗" : letter}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && q.explanation && (
            <div style={{ padding: "16px 20px", background: "#f0f9ff", borderRadius: "12px", marginBottom: "24px", fontSize: "14px", color: "#0369a1", lineHeight: 1.6, border: "1px solid #bae6fd" }}>
              <strong>💡 Explanation:</strong> {q.explanation}
            </div>
          )}

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {showExplanation && (
              <button className="btn btn-p" onClick={handleNext}>
                {currentIdx === sessionQuestions.length - 1 ? "Finish Practice" : "Next Question →"}
              </button>
            )}
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

          return (
            <div
              key={cat.id}
              className="card"
              onClick={() => loadCategory(cat)}
              style={{ padding: "28px", cursor: "pointer", transition: "all 0.25s", borderLeft: `4px solid ${cat.color}`, position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: cat.colorLight, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {cat.icon}
                </div>
                {accuracy !== null && (
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: accuracy >= 70 ? "#dcfce7" : accuracy >= 40 ? "#fef3c7" : "#fee2e2", color: accuracy >= 70 ? "#15803d" : accuracy >= 40 ? "#92400e" : "#b91c1c" }}>
                    {accuracy}% avg
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{cat.label}</h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.5 }}>{cat.description}</p>
              {stats && (
                <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "12px" }}>
                  <span>{stats.sessions} sessions</span>
                  <span>{stats.total} questions</span>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: cat.color, opacity: 0.3 }}></div>
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
