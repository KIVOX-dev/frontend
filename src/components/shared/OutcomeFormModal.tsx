"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useModalA11y } from "@/hooks/useModalA11y";
import { EXAMS, MULTIPART, outcomeFormData, type StudentOutcome } from "@/lib/outcomes";

type StudentOption = { id: string; name: string; roll_number: string | null; department: string };

interface OutcomeFormModalProps {
  type: StudentOutcome["type"];
  /** Admins file on a student's behalf, so the form gets a student search. Students file for themselves. */
  pickStudent?: boolean;
  onClose: () => void;
  onCreated: (outcome: StudentOutcome) => void;
}

const HIGHER_DEFAULT = { course: "", institution_name: "", admission_year: "" };
const EXAM_DEFAULT = { exam: "GATE", exam_year: String(new Date().getFullYear()), score: "", rank_or_percentile: "", qualified: false };

const TITLES = { higher_study: "Report a higher-study admission", competitive_exam: "Report a competitive-exam result" } as const;
const PROOF_LABEL = { higher_study: "Admission proof", competitive_exam: "Score card" } as const;

/**
 * Shared by the student's Placements screen (reporting their own) and the
 * admin's Reports & Compliance screen (entering on someone's behalf — an
 * admin's entry is verified straight away, a student's waits for review).
 */
export function OutcomeFormModal({ type, pickStudent = false, onClose, onCreated }: OutcomeFormModalProps) {
  const [higher, setHigher] = useState(HIGHER_DEFAULT);
  const [exam, setExam] = useState(EXAM_DEFAULT);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");

  const titleId = "outcome-form-title";
  const { panelRef, dialogProps } = useModalA11y(true, useCallback(() => !submitting && onClose(), [submitting, onClose]), titleId);

  useEffect(() => {
    if (!pickStudent) return;
    const timer = setTimeout(() => {
      api
        .get<StudentOption[]>("/reports/students", { params: search.trim() ? { q: search.trim() } : {} })
        .then((res) => setOptions(res.data))
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [pickStudent, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pickStudent && !studentId) {
      setError("Choose the student this is for.");
      return;
    }
    if (type === "higher_study" && (!higher.course.trim() || !higher.institution_name.trim())) {
      setError("Course and institution are required.");
      return;
    }
    if (type === "competitive_exam" && !exam.exam_year) {
      setError("Exam year is required.");
      return;
    }

    setSubmitting(true);
    try {
      const fields =
        type === "higher_study"
          ? { type, student_id: studentId, course: higher.course.trim(), institution_name: higher.institution_name.trim(), admission_year: higher.admission_year }
          : { type, student_id: studentId, exam: exam.exam, exam_year: exam.exam_year, score: exam.score.trim(), rank_or_percentile: exam.rank_or_percentile.trim(), qualified: exam.qualified };
      const res = await api.post<StudentOutcome>("/outcomes", outcomeFormData(fields, file), MULTIPART);
      onCreated(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't save this. Please check the details and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}
    >
      <div ref={panelRef} {...dialogProps} className="card" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <h3 id={titleId} style={{ fontSize: "18px", fontWeight: 700 }}>
              {TITLES[type]}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
              {pickStudent ? "Entries added by an admin are verified straight away." : "Your college verifies these details before they count."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%", border: "none", background: "var(--bg)", cursor: "pointer", fontSize: "16px" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "18px" }}>
          {error && (
            <div role="alert" style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>
              {error}
            </div>
          )}

          {pickStudent && (
            <div style={{ marginBottom: "14px" }}>
              <label className="lbl">Student</label>
              <input type="search" className="fi" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number" />
              <select className="fi" style={{ marginTop: "8px" }} value={studentId} onChange={(e) => setStudentId(e.target.value)} size={Math.min(Math.max(options.length, 2), 5)}>
                {options.length === 0 && <option value="" disabled>No students found</option>}
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.roll_number ? ` · ${s.roll_number}` : ""} · {s.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "higher_study" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Course</label>
                  <input className="fi" value={higher.course} onChange={(e) => setHigher({ ...higher, course: e.target.value })} placeholder="e.g. M.Sc Physics" required />
                </div>
                <div>
                  <label className="lbl">Institution</label>
                  <input className="fi" value={higher.institution_name} onChange={(e) => setHigher({ ...higher, institution_name: e.target.value })} placeholder="e.g. IISc Bangalore" required />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Admission year (optional)</label>
                <input type="number" className="fi" min={1990} max={new Date().getFullYear() + 1} value={higher.admission_year} onChange={(e) => setHigher({ ...higher, admission_year: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Exam</label>
                  <select className="fi" value={exam.exam} onChange={(e) => setExam({ ...exam, exam: e.target.value })}>
                    {EXAMS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl">Exam year</label>
                  <input type="number" className="fi" min={1990} max={new Date().getFullYear() + 1} value={exam.exam_year} onChange={(e) => setExam({ ...exam, exam_year: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Score (optional)</label>
                  <input className="fi" value={exam.score} onChange={(e) => setExam({ ...exam, score: e.target.value })} placeholder="e.g. 612" />
                </div>
                <div>
                  <label className="lbl">Rank / percentile (optional)</label>
                  <input className="fi" value={exam.rank_or_percentile} onChange={(e) => setExam({ ...exam, rank_or_percentile: e.target.value })} placeholder="e.g. AIR 1450" />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "14px" }}>
                <input type="checkbox" checked={exam.qualified} onChange={(e) => setExam({ ...exam, qualified: e.target.checked })} />
                I qualified in this exam
              </label>
            </>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label className="lbl">{PROOF_LABEL[type]} (optional)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="fi" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>PDF, JPG, or PNG — up to 10MB. You can add it later too.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-o" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-p" disabled={submitting}>
              {submitting ? "Saving..." : pickStudent ? "Add" : "Submit for Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
