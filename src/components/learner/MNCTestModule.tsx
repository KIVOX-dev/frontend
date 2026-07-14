"use client";

import React, { useState, useEffect } from "react";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  correct_answer?: string;
  explanation?: string;
  data_presentation?: string;
};

type CompanyTrack = {
  id: string;
  name: string;
  logo: string;
  color: string;
  colorLight: string;
  description: string;
  sections: { label: string; file: string; count: number }[];
};

const COMPANY_TRACKS: CompanyTrack[] = [
  {
    id: "tcs",
    name: "TCS NQT",
    logo: "T",
    color: "#1a73e8",
    colorLight: "#e8f0fe",
    description: "Quantitative, Logical & Verbal — TCS National Qualifier Test pattern",
    sections: [
      { label: "Quantitative", file: "/quantitative_mcq.json", count: 10 },
      { label: "Logical", file: "/logical_mcq_500.json", count: 10 },
      { label: "Verbal", file: "/verbal_json_20260418_40a84d.json", count: 5 },
    ],
  },
  {
    id: "infosys",
    name: "Infosys InfyTQ",
    logo: "I",
    color: "#0071c5",
    colorLight: "#e0f2fe",
    description: "Quantitative Aptitude, Logical Ability & Verbal Proficiency",
    sections: [
      { label: "Quantitative", file: "/quantitative_mcq.json", count: 12 },
      { label: "Logical", file: "/logical_mcq_500.json", count: 8 },
      { label: "Verbal", file: "/verbal_json_20260418_40a84d.json", count: 5 },
    ],
  },
  {
    id: "wipro",
    name: "Wipro NLTH",
    logo: "W",
    color: "#6d28d9",
    colorLight: "#ede9fe",
    description: "National Level Talent Hunt — Aptitude & Verbal sections",
    sections: [
      { label: "Quantitative", file: "/quantitative_mcq.json", count: 15 },
      { label: "Verbal", file: "/verbal_json_20260418_40a84d.json", count: 10 },
    ],
  },
  {
    id: "cognizant",
    name: "Cognizant GenC",
    logo: "C",
    color: "#0d9488",
    colorLight: "#ccfbf1",
    description: "GenC / GenC Elevate — Analytical, Logical & English",
    sections: [
      { label: "Analytical", file: "/quantitative_mcq.json", count: 8 },
      { label: "Logical", file: "/logical_mcq_500.json", count: 8 },
      { label: "Verbal", file: "/verbal_json_20260418_40a84d.json", count: 8 },
      { label: "Data Interpretation", file: "/datainterpretation_json_20260418_efaa7a.json", count: 6 },
    ],
  },
  {
    id: "accenture",
    name: "Accenture",
    logo: "A",
    color: "#a855f7",
    colorLight: "#faf5ff",
    description: "Cognitive, Technical & Communication assessments",
    sections: [
      { label: "Cognitive", file: "/logical_mcq_500.json", count: 10 },
      { label: "Quantitative", file: "/quantitative_mcq.json", count: 10 },
      { label: "English", file: "/verbal_json_20260418_40a84d.json", count: 5 },
    ],
  },
  {
    id: "zoho",
    name: "Zoho",
    logo: "Z",
    color: "#dc2626",
    colorLight: "#fee2e2",
    description: "Advanced problem solving, logical & quantitative reasoning",
    sections: [
      { label: "Problem Solving", file: "/quantitative_mcq.json", count: 15 },
      { label: "Logical", file: "/logical_mcq_500.json", count: 10 },
      { label: "Data Interpretation", file: "/datainterpretation_json_20260418_efaa7a.json", count: 5 },
    ],
  },
];

function resolveAnswer(q: Question): string {
  const raw = q.correct_answer || q.answer || "";
  if (/^[A-D]$/i.test(raw.trim())) {
    const idx = raw.trim().toUpperCase().charCodeAt(0) - 65;
    return q.options[idx] ?? raw;
  }
  return raw;
}

export function MNCTestModule() {
  const [activeTrack, setActiveTrack] = useState<CompanyTrack | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testDone, setTestDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startTrack = async (track: CompanyTrack) => {
    setLoading(true);
    setActiveTrack(track);
    try {
      let allQs: Question[] = [];
      for (const section of track.sections) {
        const res = await fetch(section.file);
        const data = await res.json();
        const pool: Question[] = Array.isArray(data) ? data : (data.questions || []);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        allQs = [...allQs, ...shuffled.slice(0, section.count)];
      }
      setQuestions(allQs);
      setCurrentIdx(0);
      setAnswers({});
      setSelectedAnswer(null);
      setShowResult(false);
      setTestDone(false);
      // Timer: 1.5 min per question
      const totalTime = allQs.length * 90;
      setTimeLeft(totalTime);
      setTimerActive(true);
    } catch (err) {
      alert("Failed to load test data.");
      setActiveTrack(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (opt: string) => {
    setSelectedAnswer(opt);
    setAnswers(prev => ({ ...prev, [currentIdx]: opt }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
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

  const finishTest = () => {
    setTimerActive(false);
    setTestDone(true);
  };

  // ──── Results Screen ────
  if (testDone && activeTrack) {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === resolveAnswer(q)) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="screen active" style={{ padding: "40px" }}>
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto", padding: "48px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: activeTrack.colorLight, color: activeTrack.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 900, margin: "0 auto 24px" }}>
            {activeTrack.logo}
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>{activeTrack.name} — Results</h2>
          <p style={{ color: "var(--muted)", marginBottom: "32px" }}>{questions.length} questions · {answeredCount} answered</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "36px" }}>
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#16a34a" }}>{correct}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>Correct</div>
            </div>
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#dc2626" }}>{answeredCount - correct}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>Wrong</div>
            </div>
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: activeTrack.color }}>{pct}%</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>Score</div>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ width: "100%", height: "12px", background: "var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "32px" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "#16a34a" : pct >= 35 ? "#d97706" : "#dc2626", borderRadius: "6px", transition: "width 1s ease" }}></div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button className="btn" onClick={() => { setActiveTrack(null); setTestDone(false); }}>Back to Companies</button>
            <button className="btn btn-p" onClick={() => startTrack(activeTrack)}>Retry Test</button>
          </div>
        </div>
      </div>
    );
  }

  // ──── Test Taking Screen ────
  if (activeTrack && questions.length > 0 && !loading) {
    const q = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="screen active" style={{ padding: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: activeTrack.colorLight, color: activeTrack.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900 }}>
              {activeTrack.logo}
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800 }}>{activeTrack.name}</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>{answeredCount}/{questions.length} answered</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "8px 16px", borderRadius: "8px", background: timeLeft < 120 ? "#fee2e2" : "var(--bg)", color: timeLeft < 120 ? "#dc2626" : "var(--text)", fontWeight: 700, fontSize: "16px", fontFamily: "monospace" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button className="btn btn-p" onClick={finishTest}>Submit Test</button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", marginBottom: "24px" }}>
          <div style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, height: "100%", background: activeTrack.color, borderRadius: "2px", transition: "width 0.3s" }}></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "24px" }}>
          {/* Question */}
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Question {currentIdx + 1} of {questions.length}</div>

            {q.data_presentation && (
              <div style={{ padding: "14px 18px", background: "var(--bg)", borderRadius: "10px", marginBottom: "20px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, borderLeft: `3px solid ${activeTrack.color}` }}>
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
                      background: isSelected ? activeTrack.colorLight : "var(--bg)",
                      border: isSelected ? `2px solid ${activeTrack.color}` : "2px solid var(--border)",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: isSelected ? activeTrack.color : "var(--text)",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: isSelected ? activeTrack.color : "var(--border)", color: isSelected ? "#fff" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                      {letter}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn" disabled={currentIdx === 0} onClick={handlePrev}>← Previous</button>
              <button className="btn btn-p" onClick={handleNext} disabled={currentIdx === questions.length - 1}>
                Next →
              </button>
            </div>
          </div>

          {/* Question palette */}
          <div className="card" style={{ padding: "20px", height: "fit-content" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>Question Palette</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setSelectedAnswer(answers[idx] || null); }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: idx === currentIdx ? `2px solid ${activeTrack.color}` : "1px solid var(--border)",
                    background: answers[idx] ? activeTrack.colorLight : idx === currentIdx ? "var(--bg)" : "transparent",
                    color: answers[idx] ? activeTrack.color : "var(--text)",
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
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: activeTrack.colorLight, border: `1px solid ${activeTrack.color}` }}></div>
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

  // ──── Company Selection Screen ────
  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>MNC Company Tests</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Practice timed tests modeled after real company hiring exams.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {COMPANY_TRACKS.map(track => {
          const totalQs = track.sections.reduce((s, sec) => s + sec.count, 0);
          const totalMins = Math.ceil(totalQs * 1.5);

          return (
            <div
              key={track.id}
              className="card"
              style={{ padding: "28px", cursor: "pointer", transition: "all 0.25s", overflow: "hidden", position: "relative" }}
              onClick={() => startTrack(track)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: track.colorLight, color: track.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900 }}>
                  {track.logo}
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{track.name}</h3>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>{totalQs} Qs · {totalMins} min</div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.5 }}>{track.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {track.sections.map(s => (
                  <span key={s.label} style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: track.colorLight, color: track.color }}>
                    {s.label} ({s.count})
                  </span>
                ))}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: track.color, opacity: 0.4 }}></div>
            </div>
          );
        })}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading test...</div>}
    </div>
  );
}
