"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/errors";
import { FileSpreadsheet, FileDown } from "./dazzleIcons";
import { SectionError } from "./collegeAdminShared";

type TabId = "nirf" | "naac" | "nba" | "higher-studies" | "competitive-exams" | "offer-letters" | "audit-log";
type Department = { id: string; name: string };
type Completeness = { missing_outcome: number; total_students: number };

type NirfRow = {
  department: string;
  batch_year: number;
  graduating: number;
  placed: number;
  placement_pct: number;
  median_salary_lpa: number | null;
  higher_studies: number | null;
};
type NirfReport = { available_years: number[]; year: number; batches: number[]; rows: NirfRow[]; completeness: Completeness };

type LetterStatus = "pending" | "uploaded" | "verified" | "rejected";
type OfferRow = { id: string; student: string; roll_number: string | null; department: string; company: string; role: string; status: LetterStatus };
type OfferReport = {
  available_years: number[];
  counts: Record<LetterStatus, number> & { total: number };
  rows: OfferRow[];
  completeness: Completeness;
};

type AuditRow = { id: string; at: string; action: string; actor: string; actor_role: string | null; student: string | null; company: string | null; detail: string | null };
type AuditReport = { rows: AuditRow[]; total: number; page: number; limit: number; available_years: number[] };

const TABS: { id: TabId; label: string; ready: boolean; soon?: string[] }[] = [
  { id: "nirf", label: "NIRF", ready: true },
  {
    id: "naac",
    label: "NAAC",
    ready: false,
    soon: ["Criterion 5.2.1 — placement of outgoing students", "Criterion 5.2.2 — progression to higher education", "Criterion 5.2.3 — competitive exam qualifiers", "Evidence links for each entry"],
  },
  { id: "nba", label: "NBA", ready: false, soon: ["Placement and higher-studies data in NBA's prescribed format"] },
  { id: "higher-studies", label: "Higher Studies", ready: false, soon: ["Student list with course and institution", "Admission proof per student"] },
  { id: "competitive-exams", label: "Competitive Exams", ready: false, soon: ["GATE, NET, CAT and GRE results", "Score cards per student"] },
  { id: "offer-letters", label: "Offer Letters", ready: true },
  { id: "audit-log", label: "Audit Log", ready: true },
];

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
  offer_letter_reminder: "Sent offer-letter reminders",
};

// A batch graduating in 2026 belongs to academic year 2025–26.
const academicYear = (graduatingYear: number) => `${graduatingYear - 1}–${String(graduatingYear).slice(2)}`;

const th: React.CSSProperties = { padding: "12px 8px", textAlign: "left" };
const td: React.CSSProperties = { padding: "12px 8px", fontSize: "14px" };

export function ReportsCompliance() {
  const [tab, setTab] = useState<TabId>("nirf");
  const [year, setYear] = useState<number | "all">("all");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const [nirf, setNirf] = useState<NirfReport | null>(null);
  const [offers, setOffers] = useState<OfferReport | null>(null);
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [reminding, setReminding] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const latestRequest = useRef(0);
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
    if (!tabMeta.ready) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError("");
    try {
      if (tab === "nirf") {
        const res = await api.get<NirfReport>("/reports/nirf", { params });
        if (requestId !== latestRequest.current) return;
        setNirf(res.data);
        setYears(res.data.available_years);
      } else if (tab === "offer-letters") {
        const res = await api.get<OfferReport>("/reports/offer-letters", { params });
        if (requestId !== latestRequest.current) return;
        setOffers(res.data);
        setYears(res.data.available_years);
      } else if (tab === "audit-log") {
        const res = await api.get<AuditReport>("/reports/audit-log", { params: { ...params, page } });
        if (requestId !== latestRequest.current) return;
        setAudit(res.data);
        setYears(res.data.available_years);
      }
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(extractErrorMessage(err, "Couldn't load this report"));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [tab, tabMeta.ready, params, page]);

  useEffect(() => {
    load();
  }, [load]);

  // NIRF always reports on one anchor year; with "All years" selected the
  // server picks the latest, and that's what the dropdown should show.
  const yearSelectValue = year === "all" && tab === "nirf" && nirf ? nirf.year : year;

  const completeness =
    tab === "nirf" ? nirf?.completeness : tab === "offer-letters" ? offers?.completeness : undefined;

  const exportRows = (): { sheet: string; rows: Record<string, string | number>[] } => {
    if (tab === "nirf" && nirf) {
      return {
        sheet: "NIRF",
        rows: nirf.rows.map((r) => ({
          Programme: r.department,
          "Academic year": academicYear(r.batch_year),
          Graduating: r.graduating,
          Placed: r.placed,
          "Placement %": r.placement_pct,
          "Median salary (LPA)": r.median_salary_lpa ?? "—",
          "Higher studies": r.higher_studies ?? "Not tracked",
        })),
      };
    }
    if (tab === "offer-letters" && offers) {
      return {
        sheet: "Offer letters",
        rows: offers.rows.map((r) => ({
          Student: r.student,
          "Roll no": r.roll_number ?? "—",
          Programme: r.department,
          Company: r.company,
          Role: r.role,
          Status: STATUS_STYLE[r.status].label,
        })),
      };
    }
    return {
      sheet: "Audit log",
      rows: (audit?.rows ?? []).map((r) => ({
        When: new Date(r.at).toLocaleString(),
        By: r.actor,
        Action: ACTION_LABEL[r.action] ?? r.action,
        Student: r.student ?? "—",
        Company: r.company ?? "—",
        Detail: r.detail ?? "—",
      })),
    };
  };

  const hasRows = tab === "nirf" ? !!nirf?.rows.length : tab === "offer-letters" ? !!offers?.rows.length : !!audit?.rows.length;

  const handleExportExcel = async () => {
    if (!hasRows) return;
    setExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const { sheet, rows } = exportRows();
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheet);
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
    const pending = offers?.counts.pending ?? 0;
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

  const selectStyle: React.CSSProperties = { minWidth: "160px" };

  return (
    <div className="screen active" id="screen-reports">
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
            {tab !== "nirf" && <option value="all">All years</option>}
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
        {tabMeta.ready && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button type="button" className="btn btn-g" onClick={handleExportExcel} disabled={!hasRows || exporting !== null}>
              <FileSpreadsheet size={16} /> {exporting === "excel" ? "Exporting…" : "Excel"}
            </button>
            <button type="button" className="btn btn-g" onClick={handleExportPdf} disabled={!hasRows || exporting !== null}>
              <FileDown size={16} /> {exporting === "pdf" ? "Exporting…" : "PDF"}
            </button>
          </div>
        )}
      </div>

      {completeness && completeness.missing_outcome > 0 && (
        <div
          role="status"
          style={{ padding: "10px 14px", marginBottom: "16px", borderRadius: "8px", background: "#fef3c7", color: "#92400e", fontSize: "14px" }}
        >
          ⚠ {completeness.missing_outcome} student{completeness.missing_outcome === 1 ? "" : "s"} missing outcome
          <span style={{ opacity: 0.8 }}> — of {completeness.total_students} in this selection, none has a placement on record.</span>
        </div>
      )}

      {!tabMeta.ready ? (
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{tabMeta.label} — coming soon</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "12px" }}>
            This report needs data the platform doesn&apos;t collect yet. It will show:
          </p>
          <ul style={{ paddingLeft: "20px", color: "var(--text)", fontSize: "14px", lineHeight: 1.8 }}>
            {tabMeta.soon?.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="card" style={{ padding: "24px" }} ref={printRef}>
          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>Loading report…</div>
          ) : error ? (
            <SectionError message={error} onRetry={load} />
          ) : tab === "nirf" && nirf ? (
            <NirfTable report={nirf} />
          ) : tab === "offer-letters" && offers ? (
            <OfferLetters report={offers} reminding={reminding} onRemind={handleRemind} />
          ) : tab === "audit-log" && audit ? (
            <AuditTable report={audit} onPage={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function NirfTable({ report }: { report: NirfReport }) {
  return (
    <>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>NIRF — programme-wise placement</h3>
      <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
        Last three graduating batches: {report.batches.map(academicYear).join(", ")}. Only verified placements count as placed.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
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
                <td style={{ ...td, color: "var(--muted)" }}>{r.higher_studies ?? "Not tracked"}</td>
              </tr>
            ))}
            {report.rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
                  No students found for these batches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OfferLetters({ report, reminding, onRemind }: { report: OfferReport; reminding: boolean; onRemind: () => void }) {
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
      {report.counts.rejected > 0 && (
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{report.counts.rejected} rejected (not counted above).</p>
      )}
      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
              <th style={th}>Student</th>
              <th style={th}>Roll no</th>
              <th style={th}>Programme</th>
              <th style={th}>Company</th>
              <th style={th}>Role</th>
              <th style={th}>Offer letter</th>
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
              </tr>
            ))}
            {report.rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
                  No placements recorded for this selection.
                </td>
              </tr>
            )}
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
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Audit log</h3>
      <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
        Every placement added, verified or deleted, and every reminder sent — who did it and when. Recording started when this report was introduced, so earlier activity isn&apos;t listed.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
              <th style={th}>When</th>
              <th style={th}>By</th>
              <th style={th}>Action</th>
              <th style={th}>Student</th>
              <th style={th}>Company</th>
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
                <td style={td}>{r.company ?? "—"}</td>
              </tr>
            ))}
            {report.rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
                  No activity recorded yet for this selection.
                </td>
              </tr>
            )}
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
