"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useAuthStore } from "@/stores/authStore";

type Student = {
  id: number;
  name: string;
  email: string;
  department?: string;
  status?: string;
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

// Fetches the current page of students for a given search string. Takes an
// AbortSignal so useDebouncedSearch can cancel a still-in-flight request
// when the user keeps typing — otherwise a slow response to an earlier
// keystroke could arrive after (and overwrite) a faster response to a later
// one, showing results for a query that's no longer in the search box.
async function fetchStudentsPage(search: string, signal: AbortSignal): Promise<Student[]> {
  const config: ApiRequestConfig = { signal, params: search ? { search } : undefined };
  const res = await api.get<(Omit<Student, "name"> & { name?: string; full_name?: string })[]>(`/students`, config);
  // The API names the field full_name; the table and modal read `name`.
  return res.data.map((s) => ({ ...s, name: s.name ?? s.full_name ?? "Unnamed student" }));
}

const REPORT_NAVY = "#1f2a44";
const REPORT_BLUE = "#1565c0";
const REPORT_LINE = "#d9dde5";
const REPORT_SERIF = "Georgia, 'Times New Roman', serif";

function reportFileName(name: string) {
  return `${name.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "Student"}_TalentSnaps_Report.pdf`;
}

// Printable report, styled after the TalentSnaps student placement report.
// Inline styles only (not the app's CSS variables/classes) so html2canvas
// renders it identically regardless of theme; it is mounted off-screen at
// A4 width so the on-screen modal is unaffected.
function StudentReport({ student, data }: { student: Student; data: DashboardData }) {
  const issued = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const initials = student.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const passed = data.history?.filter((a) => a.passed).length ?? 0;
  const stats: [string, string][] = [
    [String(data.tests_completed), "Aptitude tests"],
    [`${data.avg_accuracy.toFixed(1)}%`, "Average accuracy"],
    [String(passed), "Tests passed"],
    [String(data.interviews_completed), "Mock interviews"],
  ];
  const heading: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    color: REPORT_NAVY,
    borderBottom: `1.5px solid ${REPORT_NAVY}`,
    paddingBottom: "6px",
    margin: "26px 0 14px",
  };

  return (
    <div
      id="student-report-sheet"
      style={{ width: "794px", boxSizing: "border-box", padding: "40px 48px", background: "#fff", color: "#111827", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- html2canvas needs a plain <img> */}
        <img src="/brand/lockup.png" alt="TalentSnaps" style={{ height: "46px", width: "auto" }} crossOrigin="anonymous" />
        <div style={{ textAlign: "right", fontSize: "11px", lineHeight: 1.5 }}>Issued {issued}</div>
      </div>

      <div style={{ textAlign: "center", marginTop: "22px", paddingBottom: "12px", borderBottom: `3px double ${REPORT_NAVY}` }}>
        <div style={{ fontFamily: REPORT_SERIF, fontSize: "22px", fontWeight: 700, color: REPORT_NAVY }}>TALENTSNAPS REPORT</div>
        <div style={{ fontFamily: REPORT_SERIF, fontStyle: "italic", fontSize: "12px", marginTop: "6px" }}>Prepared for the College Administration</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "28px", margin: "24px 0" }}>
        <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "#6d3fc4", color: "#fff", fontSize: "28px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {initials}
        </div>
        <table style={{ borderCollapse: "collapse", fontSize: "13px" }}>
          <tbody>
            {(
              [
                ["Name", student.name],
                ["Email", student.email],
                ["Department", student.department || "—"],
              ] as const
            ).map(([k, v]) => (
              <tr key={k}>
                <td style={{ fontWeight: 700, padding: "3px 22px 3px 0" }}>{k}</td>
                <td style={{ padding: "3px 0" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", border: `1.5px solid ${REPORT_NAVY}` }}>
        {stats.map(([value, label], i) => (
          <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderLeft: i ? `1px solid ${REPORT_NAVY}` : "none" }}>
            <div style={{ fontFamily: REPORT_SERIF, fontSize: "18px", fontWeight: 700, color: i === 1 ? REPORT_BLUE : REPORT_NAVY }}>{value}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={heading}>1. APTITUDE PERFORMANCE</div>
      {data.history && data.history.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f5f7", fontSize: "10.5px", fontWeight: 700, textAlign: "left" }}>
              <th style={{ padding: "8px" }}>DATE</th>
              <th style={{ padding: "8px" }}>SCORE</th>
              <th style={{ padding: "8px", width: "40%" }}>ACCURACY</th>
              <th style={{ padding: "8px", textAlign: "right" }}>RESULT</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((a) => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${REPORT_LINE}` }}>
                <td style={{ padding: "9px 8px" }}>{new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td style={{ padding: "9px 8px", fontWeight: 700 }}>{a.score} / {a.max_score}</td>
                <td style={{ padding: "9px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: "7px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, a.percentage))}%`, background: a.percentage >= 70 ? "#1e8e3e" : a.percentage >= 40 ? "#f59e0b" : "#dc2626" }} />
                    </div>
                    <span style={{ fontWeight: 700, width: "34px" }}>{Math.round(a.percentage)}%</span>
                  </div>
                </td>
                <td style={{ padding: "9px 8px", textAlign: "right", fontWeight: 700, color: a.passed ? "#1e8e3e" : "#dc2626" }}>{a.passed ? "Pass" : "Fail"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontStyle: "italic" }}>No assessments completed by this student yet.</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginTop: "70px" }}>
        {["Training and Placement Officer", "Head of Department", "Principal"].map((r) => (
          <div key={r} style={{ flex: 1, borderTop: `1px solid ${REPORT_NAVY}`, paddingTop: "6px", fontSize: "11px" }}>{r}</div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "22px", paddingTop: "8px", borderTop: `1px solid ${REPORT_LINE}`, fontSize: "10.5px" }}>
        <span>TALENTSNAPS REPORT</span>
        <span>{student.name}</span>
      </div>
    </div>
  );
}

export function StudentTracking() {
  const role = useAuthStore((s) => s.user?.role);
  const canDownloadReport = role === "college_admin" || role === "institution_admin";
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentData, setStudentData] = useState<DashboardData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const closeInsights = useCallback(() => {
    setSelectedStudent(null);
    setStudentData(null);
  }, []);
  const { panelRef: insightsPanelRef, dialogProps: insightsDialogProps } = useModalA11y(
    !!selectedStudent,
    closeInsights,
    "student-insights-title"
  );

  // Live search-as-you-type: fires 400ms after typing pauses rather than
  // waiting for an explicit submit, and cancels stale requests — see
  // useDebouncedSearch and fetchStudentsPage above. The Search button/Enter
  // key still works, bypassing the debounce via runNow() for anyone who
  // wants results the instant they finish typing.
  const { data: studentsData, loading, error, runNow } = useDebouncedSearch(search, fetchStudentsPage, { delay: 400 });
  const students = studentsData ?? [];

  useEffect(() => {
    if (error) console.error("Failed to fetch students", error);
  }, [error]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runNow();
  };

  const downloadReport = async () => {
    const element = document.getElementById("student-report-sheet");
    if (!element || !selectedStudent) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      // Built as a variable: the package's typings omit `pagebreak`, which
      // html2pdf.js itself supports (keeps table rows from splitting).
      const options = {
          margin: 0,
          filename: reportFileName(selectedStudent.name),
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 794 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
          pagebreak: { mode: ["css", "legacy"], avoid: "tr" },
      };
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setDownloading(false);
    }
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

        {loading || studentsData === null ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading students...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                    <span style={{ padding: "4px 10px", background: s.status === "approved" ? "#e6f4ea" : "#fef3c7", color: s.status === "approved" ? "#1e8e3e" : "#b45309", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{s.status || "pending"}</span>
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
          </div>
        )}
        <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--muted)" }}>Total: {students.length} students</div>
      </div>

      {canDownloadReport && selectedStudent && studentData && (
        <div aria-hidden="true" style={{ position: "fixed", left: "-10000px", top: 0 }}>
          <StudentReport student={selectedStudent} data={studentData} />
        </div>
      )}

      {selectedStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div
            ref={insightsPanelRef}
            {...insightsDialogProps}
            className="card"
            style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}
          >
            <div style={{ position: "sticky", top: 0, background: "var(--card-bg)", padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
              <div>
                <h3 id="student-insights-title" style={{ fontSize: "20px", fontWeight: 700 }}>{selectedStudent.name}&apos;s Profile Insights</h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>{selectedStudent.email}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {canDownloadReport && studentData && (
                  <button
                    type="button"
                    onClick={downloadReport}
                    disabled={downloading}
                    className="btn btn-p"
                    style={{ padding: "8px 16px", fontSize: "13px", opacity: downloading ? 0.7 : 1 }}
                  >
                    {downloading ? "Preparing…" : "Download as PDF"}
                  </button>
                )}
                <button
                  onClick={closeInsights}
                  aria-label="Close"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "var(--bg)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
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
                      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{studentData.avg_accuracy.toFixed(1)}%</div>
                    </div>
                    <div className="card" style={{ padding: "20px", background: "var(--bg)", border: "none" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>Mock Interviews</div>
                      <div style={{ fontSize: "24px", fontWeight: 800 }}>{studentData.interviews_completed}</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Detailed Test History</h4>
                  {studentData.history && studentData.history.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
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
                    </div>
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
