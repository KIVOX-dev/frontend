"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function TestHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We can fetch the dashboard data or a specific history endpoint
    // For now, we'll fetch from the student dashboard endpoint and use the recent tests, 
    // or fetch from an assessment history endpoint if available.
    // Actually, students can get their own data from the /auth/me or a student-specific endpoint.
    // Let's call /dashboard/student/{id} if we have the ID, but we might not have it easily here without authStore.
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
    </div>
  );
}
