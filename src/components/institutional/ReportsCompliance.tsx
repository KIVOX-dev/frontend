"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/errors";
import { openOutcomeProofDocument, openPlacementProofDocument } from "@/lib/placementProof";
import { MULTIPART, STATUS_BADGE, STATUS_LABEL, type StudentOutcome, type VerificationStatus } from "@/lib/outcomes";
import { OutcomeFormModal } from "@/components/shared/OutcomeFormModal";
import { FileSpreadsheet, FileDown } from "./dazzleIcons";
import { SectionError } from "./collegeAdminShared";

type TabId = "nirf" | "naac" | "nba" | "higher-studies" | "competitive-exams" | "offer-letters" | "audit-log";
type Department = { id: string; name: string };
type Completeness = { missing_outcome: number; total_students: number; pending_verification: number };
type Evidence = { kind: "placement" | "outcome"; id: string } | null;

type NirfReport = {
  available_years: number[];
  year: number;
  batches: number[];
  rows: { department: string; batch_year: number; graduating: number; placed: number; placement_pct: number; median_salary_lpa: number | null; higher_studies: number }[];
  completeness: Completeness;
};

type NbaReport = {
  available_years: number[];
  year: number;
  batches: number[];
  programmes: {
    department: string;
    average_index: number | null;
    batches: { batch_year: number; students: number; placed: number; higher_studies: number; index: number | null }[];
  }[];
  completeness: Completeness;
};

type NaacSummary = { year: number; outgoing: number; count: number; pct: number };
type NaacBase = { year: number | null; student?: string; roll_number?: string | null; programme?: string; evidence: Evidence };
type NaacReport = {
  available_years: number[];
  c521: { summary: NaacSummary[]; rows: (NaacBase & { employer: string; package_lpa: number | null })[] };
  c522: { summary: NaacSummary[]; rows: (NaacBase & { institution_joined: string; programme_admitted: string })[] };
  c523: { summary: NaacSummary[]; rows: (NaacBase & { exam: string; exam_year: number })[] };
  completeness: Completeness;
};

type PersonRow = { id: string; student?: string; roll_number?: string | null; department?: string; batch_year?: number | null; status: VerificationStatus; has_proof: boolean };
type Counts = { pending: number; verified: number; rejected: number; total: number };
type HigherReport = {
  available_years: number[];
  counts: Counts;
  rows: (PersonRow & { course: string; institution_name: string; admission_year: number | null })[];
  completeness: Completeness;
};
type ExamReport = {
  available_years: number[];
  counts: Counts;
  by_exam: Record<string, { total: number; qualified: number }>;
  rows: (PersonRow & { exam: string; exam_year: number; score: string | null; rank_or_percentile: string | null; qualified: boolean })[];
  completeness: Completeness;
};

type LetterStatus = "pending" | "uploaded" | "verified" | "rejected";
type OfferReport = {
  available_years: number[];
  counts: Record<LetterStatus, number> & { total: number };
  rows: { id: string; student: string; roll_number: string | null; department: string; company: string; role: string; status: LetterStatus; has_letter: boolean }[];
  completeness: Completeness;
};

type AuditReport = {
  rows: { id: string; at: string; action: string; actor: string; actor_role: string | null; student: string | null; subject: string | null; detail: string | null }[];
  total: number;
  page: number;
  limit: number;
  available_years: number[];
};

type Reports = {
  nirf?: NirfReport;
  naac?: NaacReport;
  nba?: NbaReport;
  "higher-studies"?: HigherReport;
  "competitive-exams"?: ExamReport;
  "offer-letters"?: OfferReport;
  "audit-log"?: AuditReport;
};

const TABS: { id: TabId; label: string; endpoint: string }[] = [
  { id: "nirf", label: "NIRF", endpoint: "/reports/nirf" },
  { id: "naac", label: "NAAC", endpoint: "/reports/naac" },
  { id: "nba", label: "NBA", endpoint: "/reports/nba" },
  { id: "higher-studies", label: "Higher Studies", endpoint: "/reports/higher-studies" },
  { id: "competitive-exams", label: "Competitive Exams", endpoint: "/reports/competitive-exams" },
  { id: "offer-letters", label: "Offer Letters", endpoint: "/reports/offer-letters" },
  { id: "audit-log", label: "Audit Log", endpoint: "/reports/audit-log" },
];

// NIRF and NBA always report on one anchor year and its two predecessors, so
// "All years" makes no sense there — the server picks the latest.
const ANCHORED: TabId[] = ["nirf", "nba"];

const STATUS_STYLE: Record<LetterStatus, { label: string; bg: string; color: string }> = {
  pending: { label: "No letter", bg: "#fef3c7", color: "#b45309" },
  uploaded: { label: "Awaiting verification", bg: "#dbeafe", color: "#1d4ed8" },
  verified: { label: "Verified", bg: "#e6f4ea", color: "#1e8e3e" },
  rejected: { label: "Rejected", bg: "#fee2e2", color: "#dc2626" },
};

const ACTION_LABEL: Record<string, string> = {
  placement_added: "Added a placement",
  placement_verified: "Verified a placement",
  placement_deleted: "Deleted a placement",
  placement_letter_attached: "Attached an offer letter",
  outcome_added: "Added a higher-study / exam entry",
  outcome_verified: "Verified a higher-study / exam entry",
  outcome_deleted: "Deleted a higher-study / exam entry",
  outcome_proof_attached: "Attached a supporting document",
  offer_letter_reminder: "Sent offer-letter reminders",
};

// A batch graduating in 2026 belongs to academic year 2025–26.
const academicYear = (graduatingYear: number) => `${graduatingYear - 1}–${String(graduatingYear).slice(2)}`;

const th: React.CSSProperties = { padding: "12px 8px", textAlign: "left" };
const td: React.CSSProperties = { padding: "12px 8px", fontSize: "14px" };
const headRow: React.CSSProperties = { borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" };
const linkButton: React.CSSProperties = { color: "var(--accent)", fontSize: "13px", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" };
const actionButton = (color: string): React.CSSProperties => ({ background: "none", border: "none", color, cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: 0 });

export function ReportsCompliance() {
  const [tab, setTab] = useState<TabId>("nirf");
  const [year, setYear] = useState<number | "all">("all");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState<Reports>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [reminding, setReminding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState<StudentOutcome["type"] | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const latestRequest = useRef(0);
  const letterInput = useRef<HTMLInputElement>(null);
  const letterTarget = useRef<string | null>(null);
  const tabMeta = TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    api.get<Department[]>("/departments").then((res) => setDepartments(res.data)).catch(() => {});
  }, []);

  const params = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (year !== "all") p.year = year;
    if (departmentId) p.department_id = departmentId;
    return p;
  }, [year, departmentId]);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Reports[TabId] & { available_years: number[] }>(tabMeta.endpoint, {
        params: tab === "audit-log" ? { ...params, page } : params,
      });
      if (requestId !== latestRequest.current) return;
      setReports((prev) => ({ ...prev, [tab]: res.data }));
      setYears(res.data.available_years);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(extractErrorMessage(err, "Couldn't load this report"));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [tab, tabMeta.endpoint, params, page]);

  useEffect(() => {
    load();
  }, [load]);

  const report = reports[tab];
  // NIRF/NBA report on one anchor year; with "All years" selected the server
  // picks the latest, and that's what the dropdown should show.
  const anchoredYear = (report as { year?: number } | undefined)?.year;
  const yearSelectValue = year === "all" && ANCHORED.includes(tab) && anchoredYear ? anchoredYear : year;
  const completeness = (report as { completeness?: Completeness } | undefined)?.completeness;

  // What each tab exports, as one or more sheets of flat rows.
  const exportSheets = (): { sheet: string; rows: Record<string, string | number>[] }[] => {
    const r = reports[tab];
    if (!r) return [];
    switch (tab) {
      case "nirf":
        return [{
          sheet: "NIRF",
          rows: (r as NirfReport).rows.map((x) => ({
            Programme: x.department, "Academic year": academicYear(x.batch_year), Graduating: x.graduating, Placed: x.placed,
            "Placed %": x.placement_pct, "Median salary (LPA)": x.median_salary_lpa ?? "—", "Higher studies": x.higher_studies,
          })),
        }];
      case "nba":
        return [{
          sheet: "NBA",
          rows: (r as NbaReport).programmes.flatMap((p) =>
            p.batches.map((b) => ({
              Programme: p.department, "Academic year": academicYear(b.batch_year), "Students (N)": b.students, "Placed (x)": b.placed,
              "Higher studies (y)": b.higher_studies, "Entrepreneurs (z)": "Not tracked", "Placement index": b.index ?? "—", "Average index": p.average_index ?? "—",
            }))
          ),
        }];
      case "naac": {
        const n = r as NaacReport;
        const ev = (e: Evidence) => (e ? "On file" : "—");
        return [
          { sheet: "5.2.1 Placement", rows: n.c521.rows.map((x) => ({ Year: x.year ? academicYear(x.year) : "—", Student: x.student ?? "—", "Roll no": x.roll_number ?? "—", Programme: x.programme ?? "—", Employer: x.employer, "Package (LPA)": x.package_lpa ?? "—", Evidence: ev(x.evidence) })) },
          { sheet: "5.2.2 Higher education", rows: n.c522.rows.map((x) => ({ Year: x.year ? academicYear(x.year) : "—", Student: x.student ?? "—", "Roll no": x.roll_number ?? "—", Programme: x.programme ?? "—", "Institution joined": x.institution_joined, "Programme admitted": x.programme_admitted, Evidence: ev(x.evidence) })) },
          { sheet: "5.2.3 Exams", rows: n.c523.rows.map((x) => ({ Year: x.year ? academicYear(x.year) : "—", Student: x.student ?? "—", "Roll no": x.roll_number ?? "—", Programme: x.programme ?? "—", Exam: x.exam, "Exam year": x.exam_year, Evidence: ev(x.evidence) })) },
        ];
      }
      case "higher-studies":
        return [{
          sheet: "Higher studies",
          rows: (r as HigherReport).rows.map((x) => ({
            Student: x.student ?? "—", "Roll no": x.roll_number ?? "—", Programme: x.department ?? "—", Course: x.course,
            Institution: x.institution_name, "Admission year": x.admission_year ?? "—", Status: STATUS_LABEL[x.status], "Proof on file": x.has_proof ? "Yes" : "No",
          })),
        }];
      case "competitive-exams":
        return [{
          sheet: "Competitive exams",
          rows: (r as ExamReport).rows.map((x) => ({
            Student: x.student ?? "—", "Roll no": x.roll_number ?? "—", Programme: x.department ?? "—", Exam: x.exam, Year: x.exam_year,
            Score: x.score ?? "—", "Rank / percentile": x.rank_or_percentile ?? "—", Qualified: x.qualified ? "Yes" : "No",
            Status: STATUS_LABEL[x.status], "Score card on file": x.has_proof ? "Yes" : "No",
          })),
        }];
      case "offer-letters":
        return [{
          sheet: "Offer letters",
          rows: (r as OfferReport).rows.map((x) => ({
            Student: x.student, "Roll no": x.roll_number ?? "—", Programme: x.department, Company: x.company, Role: x.role, Status: STATUS_STYLE[x.status].label,
          })),
        }];
      case "audit-log":
        return [{
          sheet: "Audit log",
          rows: (r as AuditReport).rows.map((x) => ({
            When: new Date(x.at).toLocaleString(), By: x.actor, Action: ACTION_LABEL[x.action] ?? x.action, Student: x.student ?? "—", Details: x.subject ?? "—", Result: x.detail ?? "—",
          })),
        }];
    }
  };

  const hasRows = exportSheets().some((s) => s.rows.length > 0);

  const handleExportExcel = async () => {
    if (!hasRows) return;
    setExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      for (const { sheet, rows } of exportSheets()) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheet);
      XLSX.writeFile(workbook, `${tab}-report.xlsx`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel file");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!hasRows || !printRef.current) return;
    setExporting("pdf");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 12,
          filename: `${tab}-report.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "pt", format: "a4", orientation: "landscape" },
        })
        .from(printRef.current)
        .save();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(null);
    }
  };

  const handleRemind = async () => {
    const pending = reports["offer-letters"]?.counts.pending ?? 0;
    if (pending === 0) return;
    if (!confirm(`Send a reminder to the students behind ${pending} placement${pending === 1 ? "" : "s"} with no offer letter?`)) return;
    setReminding(true);
    try {
      const res = await api.post<{ sent: number; skipped: number }>("/reports/offer-letters/remind", null, { params });
      toast.success(
        res.data.skipped > 0
          ? `Reminded ${res.data.sent} student${res.data.sent === 1 ? "" : "s"} (${res.data.skipped} already had an unread reminder)`
          : `Reminded ${res.data.sent} student${res.data.sent === 1 ? "" : "s"}`
      );
    } catch (err) {
      toast.error(err, "Couldn't send reminders");
    } finally {
      setReminding(false);
    }
  };

  // One wrapper for the row actions so each gets the same busy state, error
  // toast and refresh.
  const act = async (id: string, failure: string, run: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await run();
      await load();
    } catch (err) {
      toast.error(err, failure);
    } finally {
      setBusyId(null);
    }
  };

  const verifyOutcome = (id: string, status: "verified" | "rejected") =>
    act(id, "Couldn't update verification", () => api.put(`/outcomes/${id}/verify`, { verification_status: status }));

  const deleteOutcome = (id: string) => {
    if (!confirm("Delete this entry and its document? This can't be undone from the app.")) return;
    return act(id, "Couldn't delete this entry", () => api.delete(`/outcomes/${id}`));
  };

  const chooseLetter = (recordId: string) => {
    letterTarget.current = recordId;
    letterInput.current?.click();
  };

  const handleLetterFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const recordId = letterTarget.current;
    e.target.value = "";
    if (!file || !recordId) return;
    await act(recordId, "Couldn't upload the offer letter", async () => {
      const form = new FormData();
      form.append("proof_file", file);
      await api.put(`/placement-records/${recordId}/proof`, form, MULTIPART);
      toast.success("Offer letter uploaded");
    });
  };

  const openEvidence = (e: NonNullable<Evidence>) => (e.kind === "placement" ? openPlacementProofDocument(e.id) : openOutcomeProofDocument(e.id));

  const selectStyle: React.CSSProperties = { minWidth: "160px" };

  return (
    <div className="screen active" id="screen-reports">
      <input ref={letterInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleLetterFile} style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }} role="tablist" aria-label="Report type">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: tab === t.id ? "var(--ink)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: "16px 20px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--muted)" }}>
          Academic year
          <select
            className="fi"
            style={selectStyle}
            value={yearSelectValue}
            onChange={(e) => {
              setYear(e.target.value === "all" ? "all" : Number(e.target.value));
              setPage(1);
            }}
          >
            {!ANCHORED.includes(tab) && <option value="all">All years</option>}
            {years.map((y) => (
              <option key={y} value={y}>
                {academicYear(y)}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--muted)" }}>
          Programme
          <select
            className="fi"
            style={selectStyle}
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All programmes</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button type="button" className="btn btn-g" onClick={handleExportExcel} disabled={!hasRows || exporting !== null}>
            <FileSpreadsheet size={16} /> {exporting === "excel" ? "Exporting…" : "Excel"}
          </button>
          <button type="button" className="btn btn-g" onClick={handleExportPdf} disabled={!hasRows || exporting !== null}>
            <FileDown size={16} /> {exporting === "pdf" ? "Exporting…" : "PDF"}
          </button>
        </div>
      </div>

      {completeness && completeness.missing_outcome > 0 && (
        <div role="status" style={{ padding: "10px 14px", marginBottom: "12px", borderRadius: "8px", background: "#fef3c7", color: "#92400e", fontSize: "14px" }}>
          ⚠ {completeness.missing_outcome} student{completeness.missing_outcome === 1 ? "" : "s"} missing outcome
          <span style={{ opacity: 0.8 }}> — of {completeness.total_students} in this selection, none has a placement or higher-study entry on record.</span>
        </div>
      )}
      {completeness && completeness.pending_verification > 0 && (
        <div role="status" style={{ padding: "10px 14px", marginBottom: "16px", borderRadius: "8px", background: "#dbeafe", color: "#1e40af", fontSize: "14px" }}>
          {completeness.pending_verification} {completeness.pending_verification === 1 ? "entry is" : "entries are"} awaiting verification
          <span style={{ opacity: 0.8 }}> — reports count verified entries only.</span>
        </div>
      )}

      <div className="card" style={{ padding: "24px" }} ref={printRef}>
        {loading && !report ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>Loading report…</div>
        ) : error ? (
          <SectionError message={error} onRetry={load} />
        ) : !report ? null : (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            {tab === "nirf" && <NirfView report={report as NirfReport} />}
            {tab === "nba" && <NbaView report={report as NbaReport} />}
            {tab === "naac" && <NaacView report={report as NaacReport} onEvidence={openEvidence} />}
            {tab === "higher-studies" && (
              <HigherView report={report as HigherReport} busyId={busyId} onAdd={() => setAdding("higher_study")} onVerify={verifyOutcome} onDelete={deleteOutcome} />
            )}
            {tab === "competitive-exams" && (
              <ExamsView report={report as ExamReport} busyId={busyId} onAdd={() => setAdding("competitive_exam")} onVerify={verifyOutcome} onDelete={deleteOutcome} />
            )}
            {tab === "offer-letters" && (
              <OfferLetters report={report as OfferReport} reminding={reminding} busyId={busyId} onRemind={handleRemind} onUpload={chooseLetter} />
            )}
            {tab === "audit-log" && <AuditTable report={report as AuditReport} onPage={setPage} />}
          </div>
        )}
      </div>

      {adding && (
        <OutcomeFormModal
          type={adding}
          pickStudent
          onClose={() => setAdding(null)}
          onCreated={() => {
            setAdding(null);
            toast.success("Added");
            load();
          }}
        />
      )}
    </div>
  );
}

function Heading({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{title}</h3>
      {note && <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>{note}</p>}
    </>
  );
}

function Empty({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
        {children}
      </td>
    </tr>
  );
}

function NirfView({ report }: { report: NirfReport }) {
  return (
    <>
      <Heading
        title="NIRF — programme-wise placement"
        note={`Last three graduating batches: ${report.batches.map(academicYear).join(", ")}. Only verified placements and admissions count.`}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Programme</th>
              <th style={th}>Academic year</th>
              <th style={th}>Graduating</th>
              <th style={th}>Placed</th>
              <th style={th}>Placed %</th>
              <th style={th}>Median salary (LPA)</th>
              <th style={th}>Higher studies</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={`${r.department}-${r.batch_year}`} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, fontWeight: 500 }}>{r.department}</td>
                <td style={td}>{academicYear(r.batch_year)}</td>
                <td style={td}>{r.graduating}</td>
                <td style={td}>{r.placed}</td>
                <td style={td}>{r.placement_pct}%</td>
                <td style={td}>{r.median_salary_lpa ?? "—"}</td>
                <td style={td}>{r.higher_studies}</td>
              </tr>
            ))}
            {report.rows.length === 0 && <Empty cols={7}>No students found for these batches.</Empty>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function NbaView({ report }: { report: NbaReport }) {
  return (
    <>
      <Heading
        title="NBA — placement and higher studies"
        note={`Placement index = (placed + higher studies) ÷ students in the batch, for ${report.batches.map(academicYear).join(", ")}. A student both placed and in higher studies counts once, as placed. The batch's graduating count stands in for intake, and entrepreneurship isn't tracked.`}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Programme</th>
              {report.batches.map((b) => (
                <th key={b} style={th}>
                  {academicYear(b)}
                  <div style={{ fontWeight: 400, fontSize: "11px" }}>N · placed · higher · index</div>
                </th>
              ))}
              <th style={th}>Average index</th>
            </tr>
          </thead>
          <tbody>
            {report.programmes.map((p) => (
              <tr key={p.department} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, fontWeight: 500 }}>{p.department}</td>
                {p.batches.map((b) => (
                  <td key={b.batch_year} style={td}>
                    {b.students} · {b.placed} · {b.higher_studies} · <strong>{b.index ?? "—"}</strong>
                  </td>
                ))}
                <td style={{ ...td, fontWeight: 700 }}>{p.average_index ?? "—"}</td>
              </tr>
            ))}
            {report.programmes.length === 0 && <Empty cols={report.batches.length + 2}>No students found for these batches.</Empty>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function NaacSection({ title, note, summary, head, children, empty }: { title: string; note: string; summary: NaacSummary[]; head: string[]; children: React.ReactNode; empty: boolean }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <Heading title={title} note={note} />
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        {summary.map((s) => (
          <div key={s.year} style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", minWidth: "150px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{academicYear(s.year)}</div>
            <div style={{ fontSize: "22px", fontWeight: 700 }}>{s.pct}%</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {s.count} of {s.outgoing} outgoing
            </div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              {head.map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
            {empty && <Empty cols={head.length}>No verified entries yet.</Empty>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NaacView({ report, onEvidence }: { report: NaacReport; onEvidence: (e: NonNullable<Evidence>) => void }) {
  const who = (r: NaacBase) => (
    <>
      <td style={td}>{r.year ? academicYear(r.year) : "—"}</td>
      <td style={{ ...td, fontWeight: 500 }}>{r.student ?? "—"}</td>
      <td style={td}>{r.roll_number ?? "—"}</td>
      <td style={td}>{r.programme ?? "—"}</td>
    </>
  );
  const evidence = (r: NaacBase) => (
    <td style={td}>
      {r.evidence ? (
        <button type="button" onClick={() => onEvidence(r.evidence!)} style={linkButton}>
          View
        </button>
      ) : (
        <span style={{ color: "var(--muted)" }}>—</span>
      )}
    </td>
  );
  return (
    <>
      <NaacSection
        title="5.2.1 — Placement of outgoing students"
        note="Students who graduated and hold a verified placement. Evidence is the offer letter."
        summary={report.c521.summary}
        head={["Year", "Student", "Roll no", "Programme", "Employer", "Package (LPA)", "Evidence"]}
        empty={report.c521.rows.length === 0}
      >
        {report.c521.rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            {who(r)}
            <td style={td}>{r.employer}</td>
            <td style={td}>{r.package_lpa ?? "—"}</td>
            {evidence(r)}
          </tr>
        ))}
      </NaacSection>
      <NaacSection
        title="5.2.2 — Progression to higher education"
        note="Students who joined a further programme. Evidence is the admission proof."
        summary={report.c522.summary}
        head={["Year", "Student", "Roll no", "Programme", "Institution joined", "Programme admitted", "Evidence"]}
        empty={report.c522.rows.length === 0}
      >
        {report.c522.rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            {who(r)}
            <td style={td}>{r.institution_joined}</td>
            <td style={td}>{r.programme_admitted}</td>
            {evidence(r)}
          </tr>
        ))}
      </NaacSection>
      <NaacSection
        title="5.2.3 — Qualifying in competitive examinations"
        note="Students who qualified in GATE, NET, CAT, GRE or similar. Evidence is the score card."
        summary={report.c523.summary}
        head={["Year", "Student", "Roll no", "Programme", "Exam", "Exam year", "Evidence"]}
        empty={report.c523.rows.length === 0}
      >
        {report.c523.rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            {who(r)}
            <td style={td}>{r.exam}</td>
            <td style={td}>{r.exam_year}</td>
            {evidence(r)}
          </tr>
        ))}
      </NaacSection>
    </>
  );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  return <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}

// Approve / Reject (while pending), View document, Delete — shared by the
// higher-studies and competitive-exam tables.
function OutcomeActions({ row, busyId, onVerify, onDelete }: { row: PersonRow; busyId: string | null; onVerify: (id: string, s: "verified" | "rejected") => void; onDelete: (id: string) => void }) {
  const busy = busyId === row.id;
  return (
    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
      {row.status === "pending" && (
        <>
          <button type="button" disabled={busy} onClick={() => onVerify(row.id, "verified")} style={actionButton("#1e8e3e")}>
            Approve
          </button>
          <button type="button" disabled={busy} onClick={() => onVerify(row.id, "rejected")} style={actionButton("#dc2626")}>
            Reject
          </button>
        </>
      )}
      <button type="button" disabled={busy} onClick={() => onDelete(row.id)} style={actionButton("#dc2626")}>
        Delete
      </button>
    </div>
  );
}

function ProofCell({ row }: { row: PersonRow }) {
  return row.has_proof ? (
    <button type="button" onClick={() => openOutcomeProofDocument(row.id)} style={linkButton}>
      View
    </button>
  ) : (
    <span style={{ color: "var(--muted)", fontSize: "13px" }}>—</span>
  );
}

type OutcomeViewProps<R> = { report: R; busyId: string | null; onAdd: () => void; onVerify: (id: string, s: "verified" | "rejected") => void; onDelete: (id: string) => void };

function HigherView({ report, busyId, onAdd, onVerify, onDelete }: OutcomeViewProps<HigherReport>) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <Heading title="Higher studies" note={`${report.counts.verified} verified · ${report.counts.pending} awaiting verification${report.counts.rejected ? ` · ${report.counts.rejected} rejected` : ""}`} />
        <button type="button" className="btn btn-p" onClick={onAdd}>
          + Add
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Student</th>
              <th style={th}>Programme</th>
              <th style={th}>Course</th>
              <th style={th}>Institution</th>
              <th style={th}>Year</th>
              <th style={th}>Status</th>
              <th style={th}>Admission proof</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, fontWeight: 500 }}>
                  {r.student}
                  {r.roll_number && <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400 }}>{r.roll_number}</div>}
                </td>
                <td style={td}>{r.department}</td>
                <td style={td}>{r.course}</td>
                <td style={td}>{r.institution_name}</td>
                <td style={td}>{r.admission_year ?? "—"}</td>
                <td style={td}><StatusBadge status={r.status} /></td>
                <td style={td}><ProofCell row={r} /></td>
                <td style={td}><OutcomeActions row={r} busyId={busyId} onVerify={onVerify} onDelete={onDelete} /></td>
              </tr>
            ))}
            {report.rows.length === 0 && <Empty cols={8}>No higher-study entries for this selection. Students can report their own, or use + Add.</Empty>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExamsView({ report, busyId, onAdd, onVerify, onDelete }: OutcomeViewProps<ExamReport>) {
  const exams = Object.entries(report.by_exam);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <Heading title="Competitive exams" note={`${report.counts.verified} verified · ${report.counts.pending} awaiting verification${report.counts.rejected ? ` · ${report.counts.rejected} rejected` : ""}`} />
        <button type="button" className="btn btn-p" onClick={onAdd}>
          + Add
        </button>
      </div>
      {exams.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          {exams.map(([name, c]) => (
            <div key={name} style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", minWidth: "110px" }}>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{name}</div>
              <div style={{ fontSize: "22px", fontWeight: 700 }}>{c.qualified}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>qualified of {c.total}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Student</th>
              <th style={th}>Programme</th>
              <th style={th}>Exam</th>
              <th style={th}>Year</th>
              <th style={th}>Score</th>
              <th style={th}>Rank / percentile</th>
              <th style={th}>Qualified</th>
              <th style={th}>Status</th>
              <th style={th}>Score card</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, fontWeight: 500 }}>
                  {r.student}
                  {r.roll_number && <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400 }}>{r.roll_number}</div>}
                </td>
                <td style={td}>{r.department}</td>
                <td style={td}>{r.exam}</td>
                <td style={td}>{r.exam_year}</td>
                <td style={td}>{r.score ?? "—"}</td>
                <td style={td}>{r.rank_or_percentile ?? "—"}</td>
                <td style={td}>{r.qualified ? "Yes" : "No"}</td>
                <td style={td}><StatusBadge status={r.status} /></td>
                <td style={td}><ProofCell row={r} /></td>
                <td style={td}><OutcomeActions row={r} busyId={busyId} onVerify={onVerify} onDelete={onDelete} /></td>
              </tr>
            ))}
            {report.rows.length === 0 && <Empty cols={10}>No exam results for this selection. Students can report their own, or use + Add.</Empty>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OfferLetters({ report, reminding, busyId, onRemind, onUpload }: { report: OfferReport; reminding: boolean; busyId: string | null; onRemind: () => void; onUpload: (recordId: string) => void }) {
  const cards: { key: LetterStatus; hint: string }[] = [
    { key: "pending", hint: "Placement recorded, no letter on file" },
    { key: "uploaded", hint: "Letter on file, not yet verified" },
    { key: "verified", hint: "Letter checked and accepted" },
  ];
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Offer letters</h3>
        <button type="button" className="btn btn-p" onClick={onRemind} disabled={reminding || report.counts.pending === 0}>
          {reminding ? "Sending…" : "Send reminder"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "8px" }}>
        {cards.map((c) => (
          <div key={c.key} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "10px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: STATUS_STYLE[c.key].color }}>{report.counts[c.key]}</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{STATUS_STYLE[c.key].label}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{c.hint}</div>
          </div>
        ))}
      </div>
      {report.counts.rejected > 0 && <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{report.counts.rejected} rejected (not counted above).</p>}
      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>Student</th>
              <th style={th}>Roll no</th>
              <th style={th}>Programme</th>
              <th style={th}>Company</th>
              <th style={th}>Role</th>
              <th style={th}>Offer letter</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, fontWeight: 500 }}>{r.student}</td>
                <td style={td}>{r.roll_number ?? "—"}</td>
                <td style={td}>{r.department}</td>
                <td style={td}>{r.company}</td>
                <td style={td}>{r.role}</td>
                <td style={td}>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: STATUS_STYLE[r.status].bg, color: STATUS_STYLE[r.status].color }}>
                    {STATUS_STYLE[r.status].label}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    {r.has_letter && (
                      <button type="button" onClick={() => openPlacementProofDocument(r.id)} style={linkButton}>
                        View
                      </button>
                    )}
                    <button type="button" disabled={busyId === r.id} onClick={() => onUpload(r.id)} style={actionButton("var(--accent)")}>
                      {busyId === r.id ? "Uploading…" : r.has_letter ? "Replace" : "Upload"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {report.rows.length === 0 && <Empty cols={7}>No placements recorded for this selection.</Empty>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AuditTable({ report, onPage }: { report: AuditReport; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(report.total / report.limit));
  return (
    <>
      <Heading
        title="Audit log"
        note="Every placement and higher-study / exam entry added, verified, changed or deleted, and every reminder sent — who did it and when. Recording started when this report was introduced, so earlier activity isn't listed."
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={headRow}>
              <th style={th}>When</th>
              <th style={th}>By</th>
              <th style={th}>Action</th>
              <th style={th}>Student</th>
              <th style={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{new Date(r.at).toLocaleString()}</td>
                <td style={td}>
                  {r.actor}
                  {r.actor_role && <span style={{ color: "var(--muted)", fontSize: "12px" }}> · {r.actor_role.replace("_", " ")}</span>}
                </td>
                <td style={td}>
                  {ACTION_LABEL[r.action] ?? r.action}
                  {r.detail && <span style={{ color: "var(--muted)" }}> — {r.detail}</span>}
                </td>
                <td style={td}>{r.student ?? "—"}</td>
                <td style={td}>{r.subject ?? "—"}</td>
              </tr>
            ))}
            {report.rows.length === 0 && <Empty cols={5}>No activity recorded yet for this selection.</Empty>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "16px", fontSize: "13px" }}>
          <span style={{ color: "var(--muted)" }}>
            Page {report.page} of {pages}
          </span>
          <button type="button" className="btn btn-g" onClick={() => onPage(report.page - 1)} disabled={report.page <= 1}>
            Previous
          </button>
          <button type="button" className="btn btn-g" onClick={() => onPage(report.page + 1)} disabled={report.page >= pages}>
            Next
          </button>
        </div>
      )}
    </>
  );
}
