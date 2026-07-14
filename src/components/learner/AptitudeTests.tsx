import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
  id: number;
  title: string;
  assessment_type: string;
  difficulty: string;
  duration_minutes: number;
  total_marks: number;
  description: string;
};

export function AptitudeTests() {
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Test taking state
  const [activeTest, setActiveTest] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/assessments");
      setAssessments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = (test: Assessment) => {
    try {
      let qData = [];
      if (test.description) {
        const parsed = JSON.parse(test.description);
        if (Array.isArray(parsed)) {
          qData = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          qData = parsed.questions;
        }
      }
      
      if (qData.length === 0) {
        alert("This assessment has no questions attached yet.");
        return;
      }
      
      setQuestions(qData);
      setActiveTest(test);
      setCurrentQIndex(0);
      setAnswers({});
      setTestCompleted(false);
      setScore(0);
    } catch (e) {
      alert("Failed to load questions. The data might be corrupted.");
    }
  };

  const handleSelectOption = (opt: string) => {
    setAnswers({ ...answers, [currentQIndex]: opt });
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    let currentScore = 0;
    questions.forEach((q, idx) => {
      const correct = q.correct_answer || q.answer;
      if (answers[idx] === correct) {
        currentScore += 1;
      }
    });
    setScore(currentScore);
    setTestCompleted(true);
    
    // Attempt to log it to the backend
    if (user?.id) {
      api.post(`/students/${user.id}/tests`, {
        assessment_id: activeTest?.id,
        title: activeTest?.title,
        score: currentScore,
        max_score: questions.length
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
    
    return (
      <div className="screen active" style={{ padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>{activeTest.title}</h2>
            <p style={{ color: "var(--muted)" }}>Question {currentQIndex + 1} of {questions.length}</p>
          </div>
          <button className="btn" onClick={() => setActiveTest(null)}>Exit Test</button>
        </div>

        <div className="card" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
          {q.data_presentation && (
            <div style={{ padding: "16px", background: "var(--bg)", borderRadius: "12px", marginBottom: "24px", fontSize: "14px", color: "var(--muted)", fontStyle: "italic" }}>
              {q.data_presentation}
            </div>
          )}
          
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "24px", lineHeight: 1.5 }}>
            {q.question}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: "16px 20px",
                  background: answers[currentQIndex] === opt ? "var(--accent-l)" : "var(--bg)",
                  border: answers[currentQIndex] === opt ? "2px solid var(--accent)" : "2px solid var(--border)",
                  borderRadius: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: answers[currentQIndex] === opt ? "var(--accent)" : "var(--text)",
                  transition: "all 0.2s"
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button 
              className="btn" 
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(prev => prev - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-p"
              disabled={!answers[currentQIndex]}
              onClick={handleNext}
            >
              {currentQIndex === questions.length - 1 ? "Submit Test" : "Next Question"}
            </button>
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
        {assessments.map(a => (
          <div key={a.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{a.title}</h3>
              <span style={{ padding: "4px 8px", background: "var(--accent-l)", color: "var(--accent)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                {a.difficulty}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", fontSize: "13px", color: "var(--muted)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {a.duration_minutes} min
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {a.total_marks} Marks
              </div>
            </div>
            
            <div style={{ marginTop: "auto" }}>
              <button 
                className="btn btn-p" 
                style={{ width: "100%" }}
                onClick={() => startTest(a)}
              >
                Start Assessment
              </button>
            </div>
          </div>
        ))}
        
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
