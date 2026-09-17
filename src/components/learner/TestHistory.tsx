"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

type LessonAssessmentHistoryItem = {
  id: string;
  course_title: string | null;
  lesson_title: string | null;
  score: number;
  max_score: number;
  percentage: number;
  status: "completed" | "malpractice";
  created_at: string;
};

export function TestHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseAssessments, setCourseAssessments] = useState<LessonAssessmentHistoryItem[]>([]);
  const [courseAssessmentsLoading, setCourseAssessmentsLoading] = useState(true);

  useEffect(() => {
    // We can fetch the dashboard data or a specific history endpoint
    // For now, we'll fetch from the student dashboard endpoint and use the recent tests,
    // or fetch from an assessment history endpoint if available.
    // Actually, students can get their own data from the /auth/me or a student-specific endpoint.
    // Let's use authStore.
    import("@/stores/authStore").then(({ useAuthStore }) => {
      const user = useAuthStore.getState().user;
      if (user?.id) {
        api.get(`/students/${user.id}/tests`).then((res) => {
          setHistory(res.data || []);
        }).catch(console.error).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Separate source: YouTube-to-Course lesson quizzes (course.service.js#listAssessmentHistory)
    // — a different collection from the aptitude-test attempts above, so it's
    // its own section rather than merged into one undifferentiated list.
    api
      .get<LessonAssessmentHistoryItem[]>("/courses/assessment-history")
      .then((res) => setCourseAssessments(res.data || []))
      .catch(console.error)
      .finally(() => setCourseAssessmentsLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
        Loading history...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
          Test History
        </h2>
        <p style={{ color: "var(--muted)" }}>Review your past aptitude tests and mock interview results.</p>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: "40px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📝</div>
          <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "8px" }}>No Tests Completed Yet</h3>
          <p style={{ color: "var(--muted)" }}>Complete an Aptitude Test or Mock Interview to see your history here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.map((test, i) => (
            <div key={i} style={{ padding: "24px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                  Assessment #{test.assessment_id}
                </h4>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {new Date(test.completed_at).toLocaleDateString()} at {new Date(test.completed_at).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: test.percentage >= 50 ? "var(--teal)" : "var(--accent)" }}>
                  {test.percentage}%
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {test.score} / {test.max_score} Marks
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "40px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
          Course Assessments
        </h2>
        <p style={{ color: "var(--muted)" }}>Results from your YouTube-to-Course lesson quizzes.</p>
      </div>

      {courseAssessmentsLoading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>Loading…</div>
      ) : courseAssessments.length === 0 ? (
        <div style={{ padding: "40px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>No course assessments taken yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {courseAssessments.map((attempt) => (
            <div
              key={attempt.id}
              style={{
                padding: "24px",
                background: "var(--bg)",
                border: attempt.status === "malpractice" ? "1px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                  {attempt.lesson_title || "Lesson"}
                </h4>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>{attempt.course_title}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString()}
                </div>
                {attempt.status === "malpractice" && (
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#fff",
                      background: "var(--accent)",
                    }}
                  >
                    Malpractice — Disqualified
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: attempt.status === "malpractice" ? "var(--accent)" : attempt.percentage >= 50 ? "var(--teal)" : "var(--accent)" }}>
                  {attempt.percentage}%
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {attempt.score} / {attempt.max_score} Marks
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
