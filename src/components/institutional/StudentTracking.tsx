"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

type Student = {
  id: number;
  name: string;
  email: string;
  department?: string;
  status: string;
  created_at?: string;
};

type Attempt = {
  id: number;
  assessment_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  created_at: string;
};

type DashboardData = {
  tests_completed: number;
  avg_accuracy: number;
  interviews_completed: number;
  placements: number;
  history: Attempt[];
};

export function StudentTracking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentData, setStudentData] = useState<DashboardData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?search=${search}`);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const viewInsights = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingInsights(true);
    try {
      const res = await api.get(`/dashboard/student/${student.id}`);
      if (res.data?.success) {
        setStudentData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load insights", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>Student Tracking</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Monitor all enrolled students and their progress.</p>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input
            type="text"
            className="fi"
            placeholder="Search by name, email, or roll number..."
            style={{ marginBottom: 0, flex: 1 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-p" style={{ padding: "0 24px" }}>Search</button>
        </form>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading students...</div>
        ) : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Name</th>
                <th style={{ padding: "12px 8px" }}>Email</th>
                <th style={{ padding: "12px 8px" }}>Department</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{s.email}</td>
                  <td style={{ padding: "12px 8px" }}>{s.department || "—"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: s.status === "approved" ? "#e6f4ea" : "#fef3c7", color: s.status === "approved" ? "#1e8e3e" : "#b45309", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{s.status}</span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button 
                      onClick={() => viewInsights(s)} 
                      style={{ background: "none", border: "none", color: "var(--purple)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                    >
                      View Insights
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--muted)" }}>Total: {students.length} students</div>
      </div>

      {selectedStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ position: "sticky", top: 0, background: "var(--card-bg)", padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700 }}>{selectedStudent.name}&apos;s Profile Insights</h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>{selectedStudent.email}</p>
              </div>
              <button 
                onClick={() => { setSelectedStudent(null); setStudentData(null); }}
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "var(--bg)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: "24px" }}>
              {loadingInsights ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading insights...</div>
              ) : studentData ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
                    <div className="card" style={{ padding: "20px", background: "var(--bg)", border: "none" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>Aptitude Tests</div>
                      <div style={{ fontSize: "24px", fontWeight: 800 }}>{studentData.tests_completed}</div>
                    </div>
                    <div className="card" style={{ padding: "20px", background: "var(--bg)", border: "none" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>Average Accuracy</div>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{studentData.avg_accuracy}%</div>
                    </div>
                    <div className="card" style={{ padding: "20px", background: "var(--bg)", border: "none" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>Mock Interviews</div>
                      <div style={{ fontSize: "24px", fontWeight: 800 }}>{studentData.interviews_completed}</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Detailed Test History</h4>
                  {studentData.history && studentData.history.length > 0 ? (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", textTransform: "uppercase" }}>
                          <th style={{ padding: "12px 8px" }}>Date</th>
                          <th style={{ padding: "12px 8px" }}>Score</th>
                          <th style={{ padding: "12px 8px" }}>Accuracy</th>
                          <th style={{ padding: "12px 8px", textAlign: "right" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentData.history.map(attempt => (
                          <tr key={attempt.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "12px 8px", color: "var(--muted)" }}>
                              {new Date(attempt.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                              {attempt.score} / {attempt.max_score}
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "6px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${attempt.percentage}%`, background: attempt.percentage >= 70 ? "#1e8e3e" : attempt.percentage >= 40 ? "#f59e0b" : "#dc2626" }} />
                                </div>
                                <span style={{ fontSize: "13px", fontWeight: 600, width: "36px" }}>{Math.round(attempt.percentage)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "right" }}>
                              <span style={{ padding: "4px 8px", background: attempt.passed ? "#e6f4ea" : "#fee2e2", color: attempt.passed ? "#1e8e3e" : "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                                {attempt.passed ? "Pass" : "Fail"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: "32px", textAlign: "center", background: "var(--bg)", borderRadius: "12px", color: "var(--muted)" }}>
                      No assessments completed by this student yet.
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
