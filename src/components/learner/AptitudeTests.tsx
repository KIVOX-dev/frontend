import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";

type Question = {
  id: string | number;
  question: string;
  data_presentation?: string;
  options: string[];
  answer?: string;
  correct_answer?: string;
};

type Assessment = {
  id: string;
  title: string;
  difficulty: string;
  duration_minutes: number;
  total_marks: number;
  description: string;
  // Set only on the 4 open practice-bank tests (see
  // scripts/seedPracticeTests.js) — null/absent on a regular test an
  // institution admin assigned, which is what distinguishes them here.
  category?: string | null;
  // Present only on an admin-authored test that's actually been assigned to
  // this student (see test.service.js#list) — this is what "Start Test"
  // uses to fetch the real per-student question set instead of parsing
  // `description`, and what "Submit" posts the answers back to.
  assignment_id?: string | null;
  question_count?: number | null;
  start_at?: string | null;
  end_at?: string | null;
};

type TestStatus = "Upcoming" | "Active" | "Completed";

// No window (every practice-bank test, or an assigned test the admin never
// scheduled) is always available — only a test with an explicit start/end
// is ever Upcoming or Completed.
function computeStatus(test: Assessment): TestStatus {
  const now = Date.now();
  if (test.start_at && now < new Date(test.start_at).getTime()) return "Upcoming";
  if (test.end_at && now > new Date(test.end_at).getTime()) return "Completed";
  return "Active";
}

// Some question banks store the correct answer as an option letter ("B")
// rather than the option text itself — resolve to the actual text so
// scoring (which compares against the selected option's text) works either
// way. Ported from PracticeModule.tsx, which already needed this for the
// same seeded practice content. Only meaningful for practice-bank tests —
// an assigned test's fetched questions never carry an answer field at all
// (the backend strips it; scoring for those happens server-side).
function resolveAnswer(q: Question): string {
  const raw = q.correct_answer || q.answer || "";
  if (/^[A-D]$/i.test(raw.trim())) {
    const idx = raw.trim().toUpperCase().charCodeAt(0) - 65;
    return q.options[idx] ?? raw;
  }
  return raw;
}

export function AptitudeTests() {
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Test taking state
  const [activeTest, setActiveTest] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  // Keyed by question id (not index) — needed for the assignment-submit
  // path, whose payload is {question_id: selectedOption}, and works just as
  // well for the practice-bank path since those question ids are unique
  // within one test's array too.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Practice-bank tests embed a fixed session size worth of questions per
  // MNCTestModule.tsx's own convention — a whole seeded bank (500 for
  // Verbal Ability) dumped into one sitting with no cap wasn't a usable
  // session either way.
  const PRACTICE_SESSION_SIZE = 20;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/tests");
      setAssessments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (test: Assessment) => {
    if (computeStatus(test) !== "Active") return;

    // Admin-authored, assigned test — the real per-student question set
    // (answers already stripped server-side), not the description blob.
    if (test.assignment_id) {
      try {
        const res = await api.get<Question[]>(`/test-assignments/${test.assignment_id}/questions`);
        if (!res.data || res.data.length === 0) {
          toast.warning("This assessment has no questions attached yet.");
          return;
        }
        setQuestions(res.data);
        setActiveTest(test);
        setCurrentQIndex(0);
        setAnswers({});
        setTestCompleted(false);
        setScore(0);
        setTimeLeft(test.duration_minutes * 60);
        setTimerActive(true);
      } catch (err: any) {
        toast.error(err, "Unable to start this assessment right now.");
      }
      return;
    }

    // Practice-bank test — full content (with real answers) is already
    // embedded in `description`; shuffled and capped to a real session size
    // rather than dumping the whole seeded bank into one sitting.
    try {
      let qData: Question[] = [];
      if (test.description) {
        const parsed = JSON.parse(test.description);
        if (Array.isArray(parsed)) {
          qData = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          qData = parsed.questions;
        }
      }

      if (qData.length === 0) {
        toast.warning("This assessment has no questions attached yet.");
        return;
      }

      const shuffled = [...qData].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, Math.min(PRACTICE_SESSION_SIZE, shuffled.length)));
      setActiveTest(test);
      setCurrentQIndex(0);
      setAnswers({});
      setTestCompleted(false);
      setScore(0);
      setTimeLeft(test.duration_minutes * 60);
      setTimerActive(true);
    } catch (e) {
      toast.error("Failed to load questions.", "The data might be corrupted.");
    }
  };

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

  const handleSelectOption = (opt: string) => {
    const q = questions[currentQIndex];
    setAnswers({ ...answers, [String(q.id)]: opt });
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) setCurrentQIndex(currentQIndex + 1);
  };

  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex(currentQIndex - 1);
  };

  const finishTest = async () => {
    if (!activeTest) return;
    setTimerActive(false);

    // Admin-authored assigned test — the client never saw the correct
    // answers (stripped server-side), so it can't score itself; the score
    // shown is whatever the backend's submit response computes.
    if (activeTest.assignment_id) {
      setSubmitting(true);
      try {
        const res = await api.post(`/test-assignments/${activeTest.assignment_id}/submit`, {
          answers: Object.fromEntries(questions.map((q) => [String(q.id), answers[String(q.id)] || ""])),
        });
        setScore(res.data.score ?? 0);
        setTestCompleted(true);
      } catch (err: any) {
        toast.error(err, "Failed to submit. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Practice-bank test — client already has the real answers, scores
    // locally, and self-reports via /tests/submit (unchanged from before).
    let currentScore = 0;
    questions.forEach((q) => {
      if (answers[String(q.id)] === resolveAnswer(q)) currentScore += 1;
    });
    setScore(currentScore);
    setTestCompleted(true);

    if (user?.id) {
      api.post("/tests/submit", {
        test_id: activeTest.id,
        score: currentScore,
        max_score: questions.length,
        percentage: Math.round((currentScore / questions.length) * 100),
      }).catch(() => {});
    }
  };

  if (loading) return <div style={{ padding: "40px" }}>Loading tests...</div>;

  if (activeTest) {
    if (testCompleted) {
      return (
        <div className="screen active" style={{ padding: "40px" }}>
          <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Test Completed!</h2>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>You have successfully finished {activeTest.title}</p>
            
            <div style={{ fontSize: "48px", fontWeight: 900, color: "var(--accent)", marginBottom: "8px" }}>
              {score} / {questions.length}
            </div>
            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "32px" }}>
              Accuracy: {Math.round((score / questions.length) * 100)}%
            </p>
            
            <button className="btn btn-p" onClick={() => setActiveTest(null)}>Back to Tests</button>
          </div>
        </div>
      );
    }

    const q = questions[currentQIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = ((currentQIndex + 1) / questions.length) * 100;

    return (
      <div className="screen active" style={{ padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{activeTest.title}</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>{answeredCount}/{questions.length} answered</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "8px 16px", borderRadius: "8px", background: timeLeft < 120 ? "#fee2e2" : "var(--bg)", color: timeLeft < 120 ? "#dc2626" : "var(--text)", fontWeight: 700, fontSize: "16px", fontFamily: "monospace" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button className="btn btn-p" disabled={submitting} onClick={finishTest}>{submitting ? "Submitting..." : "Submit Test"}</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "3px", marginBottom: "28px", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", borderRadius: "3px", transition: "width 0.4s ease" }}></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "24px" }}>
          {/* Question */}
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Question {currentQIndex + 1} of {questions.length}</div>

            {q.data_presentation && (
              <div style={{ padding: "14px 18px", background: "var(--bg)", borderRadius: "10px", marginBottom: "20px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, borderLeft: "3px solid var(--accent)" }}>
                📊 {q.data_presentation}
              </div>
            )}

            <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "24px", lineHeight: 1.6 }}>
              {q.question}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[String(q.id)] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    style={{
                      padding: "14px 18px",
                      background: isSelected ? "var(--accent-l)" : "var(--bg)",
                      border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: isSelected ? "var(--accent)" : "var(--text)",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: isSelected ? "var(--accent)" : "var(--border)", color: isSelected ? "#fff" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                      {letter}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn" disabled={currentQIndex === 0} onClick={handlePrev}>← Previous</button>
              <button className="btn btn-p" onClick={handleNext} disabled={currentQIndex === questions.length - 1}>
                Next →
              </button>
            </div>
          </div>

          {/* Question palette */}
          <div className="card" style={{ padding: "20px", height: "fit-content" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>Question Palette</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {questions.map((qq, idx) => (
                <button
                  key={qq.id}
                  onClick={() => setCurrentQIndex(idx)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: idx === currentQIndex ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: answers[String(qq.id)] ? "var(--accent-l)" : idx === currentQIndex ? "var(--bg)" : "transparent",
                    color: answers[String(qq.id)] ? "var(--accent)" : "var(--text)",
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
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--accent-l)", border: "1px solid var(--accent)" }}></div>
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

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Aptitude Tests</h2>
        <p style={{ color: "var(--muted)" }}>Complete assessments assigned by your institution.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {assessments.map(a => {
          const status = computeStatus(a);
          const statusColors: Record<TestStatus, { bg: string; fg: string }> = {
            Upcoming: { bg: "#FEF3C7", fg: "#B45309" },
            Active: { bg: "#DCFCE7", fg: "#15803D" },
            Completed: { bg: "#F3F4F6", fg: "#6B7280" },
          };
          return (
            <div key={a.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{a.title}</h3>
                <span style={{ padding: "4px 8px", background: "var(--accent-l)", color: "var(--accent)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                  {a.difficulty}
                </span>
              </div>

              {/* For a practice-bank test, `description` holds the serialized
                  question set (see startTest() below), not display text —
                  only an admin-authored assigned test's description is
                  actually meant to be read here. */}
              {!a.category && a.description && (
                <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>{a.description}</p>
              )}

              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "3px 9px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  background: a.category ? "#DCFCE7" : "#DCE4F5",
                  color: a.category ? "#15803D" : "#0145F2",
                }}>
                  {a.category ? "Practice" : "Assigned"}
                </span>
                <span style={{
                  padding: "3px 9px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  background: statusColors[status].bg,
                  color: statusColors[status].fg,
                }}>
                  {status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "13px", color: "var(--muted)", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {a.duration_minutes} min
                </div>
                {a.question_count != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                    </svg>
                    {a.question_count} Questions
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {a.total_marks} Marks
                </div>
              </div>

              {(a.start_at || a.end_at) && (
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
                  {a.start_at && <div>Starts: {new Date(a.start_at).toLocaleString()}</div>}
                  {a.end_at && <div>Ends: {new Date(a.end_at).toLocaleString()}</div>}
                </div>
              )}

              <div style={{ marginTop: "auto" }}>
                <button
                  className="btn btn-p"
                  style={{ width: "100%" }}
                  disabled={status !== "Active"}
                  onClick={() => startTest(a)}
                >
                  {status === "Upcoming" ? "Not started yet" : status === "Completed" ? "Window closed" : "Start Assessment"}
                </button>
              </div>
            </div>
          );
        })}

        {assessments.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--muted)", background: "var(--bg)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ margin: "0 auto 16px", opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>No active assessments</h3>
            <p>You have no pending tests. Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
