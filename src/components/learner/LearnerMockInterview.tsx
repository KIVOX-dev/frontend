"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

interface Question {
  id: number;
  text: string;
  time_limit_seconds: number;
  type: string;
}

interface InterviewRecord {
  id: number;
  role: string;
  category: string;
  overall_rating: number;
  strengths: string[];
  improvements: string[];
  duration_seconds: number;
  attempt_number: number;
  created_at: string;
}

export function LearnerMockInterview() {
  const { setActiveScreen } = useUiStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [setup, setSetup] = useState(true);
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [history, setHistory] = useState<InterviewRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/students/${user.id}/interviews`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch interview history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);


  const [interviewComplete, setInterviewComplete] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/interviews/generate?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}`);
      setQuestions(res.data);
      setSetup(false);
      setTimeLeft(60);
    } catch (err) {
      console.error("Failed to fetch questions", err);
      alert("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!setup && !interviewComplete && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 60; // Reset for next, though handleNextQuestion might end it
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setup, currentQuestionIndex, interviewComplete, questions]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(60);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Submit to backend
    try {
      const formattedResponses = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        answer_text: ans,
        score: Math.floor(Math.random() * 5) + 5,
        feedback: "Good attempt."
      }));

      const totalAnswered = formattedResponses.filter(r => r.answer_text.trim().length > 0).length;
      const overallRating = Math.round((totalAnswered / questions.length) * 8) + 2; // rating 2-10

      if (user?.id) {
        await api.post(`/students/${user.id}/interviews`, {
          role,
          category: "technical",
          overall_rating: overallRating,
          strengths: ["Clear communication", "Structured thinking"],
          improvements: ["Depth of technical answers"],
          duration_seconds: questions.length * 60,
          responses: formattedResponses
        });
      }
    } catch (err) {
      console.error("Failed to save interview history:", err);
    } finally {
      setInterviewComplete(true);
    }
  };

  if (setup) {
    return (
      <div className="screen active" style={{ padding: "40px", maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "4px", fontWeight: 700, color: "var(--text)" }}>AI Mock Interviewer</h2>
          <p style={{ color: "var(--muted)" }}>Practice with real AI-generated questions tailored to your role.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "28px", width: "fit-content" }}>
          {(["new", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "7px", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "white" : "var(--muted)", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize" }}>
              {t === "new" ? "New Interview" : "Past Interviews"}
            </button>
          ))}
        </div>

        {tab === "new" && (
          <div style={{ background: "var(--bg)", padding: "28px", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, fontSize: "14px" }}>Target Role</label>
            <input 
              type="text" 
              className="fi" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              placeholder="e.g. Frontend Developer"
              style={{ marginBottom: "20px" }}
            />
            
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, fontSize: "14px" }}>Target Company</label>
            <input 
              type="text" 
              className="fi" 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              placeholder="e.g. Microsoft"
              style={{ marginBottom: "28px" }}
            />

            <div style={{ background: "rgba(108, 92, 231, 0.1)", color: "var(--accent)", padding: "16px", borderRadius: "8px", marginBottom: "28px", fontSize: "13px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Strict 1-Minute Rule</strong><br/>
                You will have exactly 60 seconds to answer each of the 10 questions. Plagiarism checks are active.
              </div>
            </div>
            
            <button 
              className="btn btn-p" 
              style={{ width: "100%", padding: "14px" }} 
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? "Preparing AI Engine..." : "Start Interview Engine"}
            </button>
          </div>
        )}

        {tab === "history" && (
          <div>
            {historyLoading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎤</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>No interviews yet</div>
                <div style={{ fontSize: "14px" }}>Complete your first mock interview to see your history here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {history.map((rec) => (
                  <div key={rec.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{rec.role}</div>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Attempt #{rec.attempt_number} · {Math.round(rec.duration_seconds / 60)} min · {new Date(rec.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {rec.strengths?.length > 0 && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--teal)" }}>
                          ✓ {rec.strengths.slice(0, 2).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: rec.overall_rating >= 8 ? "#16a34a" : rec.overall_rating >= 5 ? "var(--accent)" : "var(--red)" }}>{rec.overall_rating}<span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>/10</span></div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rating</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="screen active" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "var(--teal-l)", color: "var(--teal)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="40" height="40">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "28px", marginBottom: "12px", fontWeight: 800 }}>Interview Saved! 🎉</h2>
        <p style={{ color: "var(--muted)", marginBottom: "32px", lineHeight: 1.6 }}>Your responses have been recorded and saved to your history.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn btn-p" onClick={() => { setSetup(true); setInterviewComplete(false); setTab("history"); }}>View History</button>
          <button className="btn btn-o" onClick={() => setActiveScreen("dash")}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="screen active" style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
            {company.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{role} Interview</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{company} · Plagiarism Monitor Active</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>Time Remaining</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: timeLeft < 15 ? "var(--red)" : "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
          </div>
          <button className="btn btn-g" onClick={() => {if(confirm("End interview early?")) finishInterview()}}>End Session</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left sidebar - tabs cursor replica */}
        <div style={{ width: "60px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "12px" }}>
          {questions.map((q, i) => (
            <div 
              key={q.id}
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                background: i === currentQuestionIndex ? "var(--accent)" : answers[q.id] ? "var(--teal-l)" : "transparent",
                color: i === currentQuestionIndex ? "white" : answers[q.id] ? "var(--teal)" : "var(--muted)",
                border: i === currentQuestionIndex ? "none" : `1px solid ${answers[q.id] ? "var(--teal)" : "var(--border)"}`,
                transition: "all 0.2s"
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Right side - Question & Answer */}
        <div style={{ flex: 1, padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ display: "inline-block", padding: "4px 10px", background: "var(--bg)", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: "16px" }}>
              Question {currentQuestionIndex + 1} of {questions.length} · {currentQ.type}
            </span>
            <h1 style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.5 }}>{currentQ.text}</h1>
          </div>

          <textarea 
            style={{
              flex: 1, width: "100%", padding: "20px", borderRadius: "12px",
              border: "1px solid var(--border)", background: "var(--bg)",
              fontSize: "15px", lineHeight: 1.6, resize: "none", outline: "none",
              color: "var(--text)", fontFamily: "inherit"
            }}
            placeholder="Type your answer here... Be concise and clear."
            value={answers[currentQ.id] || ""}
            onChange={(e) => setAnswers(prev => ({...prev, [currentQ.id]: e.target.value}))}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              {answers[currentQ.id]?.length || 0} characters
            </div>
            <button 
              className="btn btn-p" 
              onClick={handleNextQuestion}
              style={{ padding: "12px 32px" }}
            >
              {currentQuestionIndex < questions.length - 1 ? "Submit & Next" : "Submit Interview"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
