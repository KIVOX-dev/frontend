"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { openOutcomeProofDocument } from "@/lib/placementProof";
import { MULTIPART, STATUS_BADGE, STATUS_LABEL, type StudentOutcome } from "@/lib/outcomes";
import { OutcomeFormModal } from "@/components/shared/OutcomeFormModal";

const th = { padding: "12px 8px" } as const;
const td = { padding: "12px 8px", color: "var(--muted)", fontSize: "14px" } as const;
const linkButton = { color: "var(--accent)", fontSize: "13px", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" } as const;

/**
 * A student's own higher-study admissions and competitive-exam results, with
 * the supporting document for each. Reported here, verified by the college —
 * verified entries are what the college's NAAC/NBA/NIRF reports count.
 */
export function StudentOutcomes({ studentId }: { studentId: string | null }) {
  const [outcomes, setOutcomes] = useState<StudentOutcome[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reporting, setReporting] = useState<StudentOutcome["type"] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await api.get<StudentOutcome[]>(`/outcomes/student/${studentId}`);
      setOutcomes(res.data || []);
    } catch (err) {
      toast.error(err, "Couldn't load your reported results");
    } finally {
      setLoaded(true);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const chooseFile = (id: string) => {
    uploadTarget.current = id;
    fileInput.current?.click();
  };

  // Adds or replaces the supporting document on an existing entry.
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadTarget.current;
    e.target.value = "";
    if (!file || !id) return;
    setBusyId(id);
    try {
      const form = new FormData();
      form.append("proof_file", file);
      const res = await api.put<StudentOutcome>(`/outcomes/${id}/proof`, form, MULTIPART);
      setOutcomes((prev) => prev.map((o) => (o.id === id ? res.data : o)));
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err, "Couldn't upload the document");
    } finally {
      setBusyId(null);
    }
  };

  const higher = outcomes.filter((o) => o.type === "higher_study");
  const exams = outcomes.filter((o) => o.type === "competitive_exam");

  const proofCell = (o: StudentOutcome) => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      {o.proof_url ? (
        <button type="button" onClick={() => openOutcomeProofDocument(o.id)} style={linkButton}>
          View
        </button>
      ) : (
        <span style={{ color: "var(--muted)", fontSize: "13px" }}>—</span>
      )}
      {/* A verified entry is locked — swapping its document would void the college's check. */}
      {o.verification_status !== "verified" && (
        <button type="button" disabled={busyId === o.id} onClick={() => chooseFile(o.id)} style={{ ...linkButton, textDecoration: "none" }}>
          {busyId === o.id ? "Uploading…" : o.proof_url ? "Replace" : "Upload"}
        </button>
      )}
    </div>
  );

  const statusCell = (o: StudentOutcome) => <span className={`badge ${STATUS_BADGE[o.verification_status]}`}>{STATUS_LABEL[o.verification_status]}</span>;

  if (!studentId) return null;

  return (
    <>
      <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />

      <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="ct" style={{ marginBottom: 0 }}>Higher Studies</div>
          <button className="btn btn-p btn-sm" onClick={() => setReporting("higher_study")}>
            + Report Admission
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 0" }}>
          Joined a master&apos;s or another programme after graduating? Tell your college the course and institution, and add your admission proof.
        </p>
        {loaded && higher.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", marginTop: "20px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                  <th style={th}>Course</th>
                  <th style={th}>Institution</th>
                  <th style={th}>Year</th>
                  <th style={th}>Status</th>
                  <th style={th}>Admission proof</th>
                </tr>
              </thead>
              <tbody>
                {higher.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...td, color: "var(--text)", fontWeight: 500 }}>{o.course}</td>
                    <td style={td}>{o.institution_name}</td>
                    <td style={td}>{o.admission_year ?? "—"}</td>
                    <td style={th}>{statusCell(o)}</td>
                    <td style={th}>{proofCell(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="ct" style={{ marginBottom: 0 }}>Competitive Exams</div>
          <button className="btn btn-p btn-sm" onClick={() => setReporting("competitive_exam")}>
            + Report Result
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 0" }}>
          Appeared in GATE, NET, CAT, GRE or another exam? Add the result and your score card so it counts for your college&apos;s records.
        </p>
        {loaded && exams.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", marginTop: "20px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                  <th style={th}>Exam</th>
                  <th style={th}>Year</th>
                  <th style={th}>Score</th>
                  <th style={th}>Rank / percentile</th>
                  <th style={th}>Qualified</th>
                  <th style={th}>Status</th>
                  <th style={th}>Score card</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...td, color: "var(--text)", fontWeight: 500 }}>{o.exam}</td>
                    <td style={td}>{o.exam_year}</td>
                    <td style={td}>{o.score ?? "—"}</td>
                    <td style={td}>{o.rank_or_percentile ?? "—"}</td>
                    <td style={td}>{o.qualified ? "Yes" : "No"}</td>
                    <td style={th}>{statusCell(o)}</td>
                    <td style={th}>{proofCell(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reporting && (
        <OutcomeFormModal
          type={reporting}
          onClose={() => setReporting(null)}
          onCreated={(created) => {
            setOutcomes((prev) => [created, ...prev]);
            setReporting(null);
            toast.success("Submitted for verification");
          }}
        />
      )}
    </>
  );
}
