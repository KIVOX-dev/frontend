"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet, RefreshCw, Download, Plus, ArrowUpRight, ArrowDownRight, ExternalLink,
} from "./dazzleIcons";
import { toast } from "@/lib/toast";
import {
  type User, type Placement, type Drive, type Department, type StudentRecord, type PlacementApplication,
  BASE_CHART_OPTIONS, ChartEmptyState, SectionError, CompanyLogo, monthKey, monthLabel,
} from "./collegeAdminShared";

// ApexCharts touches `window` at import time — never during SSR (matches the
// same guard CollegeAdminDashboard.tsx uses for its own charts).
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Every colour below comes from one validated categorical palette, in its
// fixed slot order, so each chart can be colourful without two neighbouring
// colours becoming indistinguishable (checked for colour-blind separation).
// Several of these sit below 3:1 on white, so every coloured mark also keeps
// a visible text label — colour is never the only way to read a value.
const BLUE = "#0056D2";
const AXIS = "#C3C2B7";
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const OTHER = "#94a3b8";
// Funnel stages in order: applied, shortlisted, interviewed, selected, joined.
// A re-ordering of the same slots (orange next to yellow or magenta fails the
// normal-vision check), ending on aqua for the finish line.
const FUNNEL_COLORS = ["#2a78d6", "#4a3aa7", "#e87ba4", "#eda100", "#1baf7a"];
// Placement-rate gauge and the trend area: blue into aqua.
const GRADIENT_FROM = "#2a78d6";
const GRADIENT_TO = "#1baf7a";

// A pale track in the bar's own colour (8-digit hex, ~14% alpha).
const track = (hex: string) => `${hex}24`;

const CHART_HEIGHT = 220;
const TOP_RECRUITERS = 5;

const PACKAGE_BANDS = [
  { label: "0–3", min: 0, max: 3 },
  { label: "3–5", min: 3, max: 5 },
  { label: "5–8", min: 5, max: 8 },
  { label: "8–12", min: 8, max: 12 },
  { label: "12–20", min: 12, max: 20 },
  { label: "20+", min: 20, max: Infinity },
];

// Ordered so a later stage implies every earlier one — what makes a cumulative
// funnel from a single "current status" field meaningful: there's no separate
// "reached shortlisted then advanced" history, only where each application
// currently sits.
const STATUS_ORDER = ["applied", "shortlisted", "interview", "selected"];

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  // Indian academic year convention: starts ~June/July.
  const startYear = now.getMonth() >= 5 ? y : y - 1;
  return `${startYear}–${String(startYear + 1).slice(2)}`;
}

// Continuous month keys ending with the current month — zero-filled so a
// single placement draws as a trend with context, not a lone floating dot.
function lastMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function monthlyCounts(items: { created_at?: string }[], keys: string[]): number[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = monthKey(item.created_at);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return keys.map(k => counts.get(k) || 0);
}

function fmtLPA(v: number): string {
  return `₹${v.toFixed(1)} LPA`;
}

function fmtRelative(iso?: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDeadline(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `Closes in ${days} days`;
}

// ─────────────────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────────────────

function Panel({
  title, subtitle, action, className, children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`card ${className ?? ""}`} style={{ padding: "20px", borderRadius: "14px", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{title}</h3>
          {subtitle && <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type Delta = { direction: "up" | "down"; text: string } | null;

function Stat({ label, value, caption, delta }: { label: string; value: string; caption?: string; delta?: Delta }) {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginTop: "6px", lineHeight: 1.1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap" }}>
        {delta && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700, color: delta.direction === "up" ? "#15803d" : "#dc2626" }}>
            {delta.direction === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta.text}
          </span>
        )}
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}

// Labelled horizontal bar on a full-width track — shared by the funnel and
// the department list so both read the same way.
function BarRow({ label, value, pct, note, color }: { label: React.ReactNode; value: string; pct: number; note?: string; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
          {value}
          {note && <span style={{ fontWeight: 500, color: "var(--muted)", marginLeft: "6px" }}>{note}</span>}
        </span>
      </div>
      <div style={{ height: "8px", background: track(color), borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.max(pct, pct > 0 ? 2 : 0))}%`, background: color, borderRadius: "4px", transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────

export interface PlacementDashboardProps {
  users: User[];
  placements: Placement[];
  drives: Drive[];
  departments: Department[];
  studentRecords: StudentRecord[];
  applications: PlacementApplication[];
  loading: boolean;
  /** Per-resource error message from the parent's loaders (see
   * CollegeAdminDashboard.tsx's `loadErrors`) — keyed by resource name, null
   * once a resource has loaded successfully. A failed fetch must never look
   * identical to that resource genuinely having zero rows. */
  errors: Record<string, string | null>;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onCreateDrive: () => void;
  onViewAllDrives: () => void;
}

export function PlacementDashboard({
  users, placements, drives, departments, studentRecords, applications,
  loading, errors, lastUpdated, onRefresh, onCreateDrive, onViewAllDrives,
}: PlacementDashboardProps) {
  const failedResources = useMemo(
    () =>
      (Object.entries(errors) as [string, string | null][])
        .filter(([, message]) => Boolean(message))
        .filter(([key]) => ["users", "placements", "drives", "departments", "studentRecords", "applicants"].includes(key)),
    [errors]
  );
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // ── Headline numbers ──
  const totalStudents = useMemo(() => users.filter(u => u.role === "student").length, [users]);
  const activeDrives = useMemo(() => drives.filter(d => ["open", "active"].includes(d.status)), [drives]);
  const upcomingDrives = useMemo(
    () => drives
      .filter(d => d.application_deadline && new Date(d.application_deadline) > new Date())
      .sort((a, b) => new Date(a.application_deadline!).getTime() - new Date(b.application_deadline!).getTime()),
    [drives]
  );
  const companiesRecruiting = useMemo(() => new Set(placements.map(p => p.company_name)), [placements]);
  const avgPackage = useMemo(
    () => (placements.length ? placements.reduce((s, p) => s + (p.salary_lpa || 0), 0) / placements.length : 0),
    [placements]
  );
  const highestPackage = useMemo(() => placements.reduce((max, p) => Math.max(max, p.salary_lpa || 0), 0), [placements]);
  const placementRate = totalStudents > 0 ? (placements.length / totalStudents) * 100 : 0;

  // ── Trend: last 12 months, zero-filled ──
  const monthKeys = useMemo(() => lastMonthKeys(12), []);
  const placementsByMonth = useMemo(() => monthlyCounts(placements, monthKeys), [placements, monthKeys]);

  // Month-over-month delta — only when last month gives an honest baseline.
  const placedDelta: Delta = useMemo(() => {
    const curr = placementsByMonth[placementsByMonth.length - 1];
    const prev = placementsByMonth[placementsByMonth.length - 2];
    if (!prev) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (pct === 0) return null;
    return { direction: pct > 0 ? "up" : "down", text: `${Math.abs(pct)}% vs last month` };
  }, [placementsByMonth]);

  // ── Funnel ──
  const funnelStages = useMemo(() => {
    const rank = (s: string) => STATUS_ORDER.indexOf(s);
    const active = applications.filter(a => a.status !== "rejected" && a.status !== "withdrawn");
    return [
      { label: "Applied", value: applications.length },
      { label: "Shortlisted", value: active.filter(a => rank(a.status) >= rank("shortlisted")).length },
      { label: "Interviewed", value: active.filter(a => rank(a.status) >= rank("interview")).length },
      { label: "Selected", value: active.filter(a => rank(a.status) >= rank("selected")).length },
      { label: "Joined", value: placements.length },
    ];
  }, [applications, placements]);

  // ── Package bands ──
  const packageDistribution = useMemo(
    () => PACKAGE_BANDS.map(band => ({
      label: band.label,
      count: placements.filter(p => (p.salary_lpa || 0) >= band.min && (p.salary_lpa || 0) < band.max).length,
    })),
    [placements]
  );

  // ── Recruiters: top N + "Other" ──
  const companyLeaderboard = useMemo(() => {
    const map = new Map<string, { count: number; salarySum: number }>();
    for (const p of placements) {
      const entry = map.get(p.company_name) || { count: 0, salarySum: 0 };
      entry.count += 1;
      entry.salarySum += p.salary_lpa || 0;
      map.set(p.company_name, entry);
    }
    return Array.from(map.entries())
      .map(([company, { count, salarySum }]) => ({ company, count, avgPackage: count ? Math.round((salarySum / count) * 10) / 10 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [placements]);

  const recruiterSlices = useMemo(() => {
    const top = companyLeaderboard.slice(0, TOP_RECRUITERS).map((c, i) => ({ label: c.company, value: c.count, color: CATEGORICAL[i] }));
    const rest = companyLeaderboard.slice(TOP_RECRUITERS).reduce((s, c) => s + c.count, 0);
    return rest > 0 ? [...top, { label: "Other", value: rest, color: OTHER }] : top;
  }, [companyLeaderboard]);

  // ── Departments ──
  // Colour follows the department, not its rank: slots go by name order, so a
  // department keeps its colour as rates change. Past eight, the rest are grey.
  const departmentColor = useMemo(() => {
    const names = Array.from(new Set(departments.map(d => d.name))).sort((a, b) => a.localeCompare(b));
    return new Map(names.map((name, i) => [name, CATEGORICAL[i] ?? OTHER]));
  }, [departments]);

  const departmentStats = useMemo(() => {
    const deptNameById = new Map(departments.map(d => [d.id, d.name]));
    const deptIdByStudentRecordId = new Map(studentRecords.map(s => [s.id, s.department_id]));

    const totalByDept = new Map<string, number>();
    for (const s of studentRecords) {
      if (!s.department_id) continue;
      totalByDept.set(s.department_id, (totalByDept.get(s.department_id) || 0) + 1);
    }
    const placedByDept = new Map<string, number>();
    for (const p of placements) {
      const deptId = deptIdByStudentRecordId.get(p.student_id);
      if (deptId) placedByDept.set(deptId, (placedByDept.get(deptId) || 0) + 1);
    }

    return Array.from(totalByDept.entries())
      .map(([deptId, total]) => {
        const placed = placedByDept.get(deptId) || 0;
        return {
          department: deptNameById.get(deptId) || "Unknown",
          placed,
          total,
          rate: total ? Math.round((placed / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.rate - a.rate || b.total - a.total)
      .slice(0, 6);
  }, [placements, studentRecords, departments]);

  // ── Export ──
  const handleExportExcel = async () => {
    setIsExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
        { Metric: "Students Placed", Value: placements.length },
        { Metric: "Placement Rate", Value: `${placementRate.toFixed(1)}%` },
        { Metric: "Applications Received", Value: applications.length },
        { Metric: "Companies Recruiting", Value: companiesRecruiting.size },
        { Metric: "Active Drives", Value: activeDrives.length },
        { Metric: "Average Package (LPA)", Value: avgPackage.toFixed(1) },
        { Metric: "Highest Package (LPA)", Value: highestPackage.toFixed(1) },
        { Metric: "Upcoming Drives", Value: upcomingDrives.length },
      ]), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(
        placements.length
          ? placements.map(p => ({ Company: p.company_name, Role: p.role, "Salary (LPA)": p.salary_lpa, Status: p.verification_status }))
          : [{ Company: "No placements recorded yet" }]
      ), "Placements");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(
        companyLeaderboard.length
          ? companyLeaderboard.map(c => ({ Company: c.company, "Students Hired": c.count, "Avg Package (LPA)": c.avgPackage }))
          : [{ Company: "No companies recruiting yet" }]
      ), "Companies");
      XLSX.writeFile(workbook, "placement-dashboard.xlsx");
      toast.success("Exported placement-dashboard.xlsx");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel file");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!dashboardRef.current) return;
    setIsExporting("pdf");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: "placement-dashboard.pdf",
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 1.5 },
          jsPDF: { unit: "pt", format: "a3", orientation: "landscape" },
        })
        .from(dashboardRef.current)
        .save();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(null);
    }
  };

  const hasPlacements = placements.length > 0;
  const funnelMax = Math.max(1, funnelStages[0].value);

  return (
    <div ref={dashboardRef} style={{ marginBottom: "24px" }}>
      {/* ── Toolbar — the page title lives in the parent's header, so this is
          just context + actions (not sticky: it used to float over the
          charts while scrolling). ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Academic year {currentAcademicYear()} · Updated {lastUpdated ? fmtRelative(lastUpdated.toISOString()) : "—"}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-icon" onClick={onRefresh} disabled={loading} title="Refresh" aria-label="Refresh">
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          </button>
          <button className="btn" onClick={handleExportExcel} disabled={isExporting !== null} title="Export to Excel">
            <FileSpreadsheet size={14} /> {isExporting === "excel" ? "Exporting…" : "Excel"}
          </button>
          <button className="btn" onClick={handleExportPdf} disabled={isExporting !== null} title="Export to PDF">
            <Download size={14} /> {isExporting === "pdf" ? "Exporting…" : "PDF"}
          </button>
          <button className="btn btn-p" onClick={onCreateDrive}>
            <Plus size={14} /> Create Drive
          </button>
        </div>
      </div>

      {/* KPIs/charts below are computed from whatever data each resource
          last successfully loaded — this banner is what tells the admin some
          of it failed to refresh, so the numbers aren't silently
          misrepresented as "there's genuinely nothing here". */}
      {failedResources.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <SectionError
            message={`Some dashboard data failed to load: ${failedResources.map(([, message]) => message).join(" ")}`}
            onRetry={onRefresh}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "16px" }}>
        {/* ── Row 1: headline ── */}
        <Panel title="Placement rate" subtitle={`${placements.length} of ${totalStudents} students placed`}>
          <ApexChart
            type="radialBar"
            height={CHART_HEIGHT}
            series={[Math.round(placementRate * 10) / 10]}
            options={{
              chart: { fontFamily: "inherit", sparkline: { enabled: true } },
              colors: [GRADIENT_FROM],
              fill: { type: "gradient", gradient: { shade: "light", type: "horizontal", gradientToColors: [GRADIENT_TO], stops: [0, 100] } },
              plotOptions: {
                radialBar: {
                  startAngle: -110,
                  endAngle: 110,
                  hollow: { size: "62%" },
                  track: { background: track(GRADIENT_FROM), strokeWidth: "100%" },
                  dataLabels: {
                    name: { show: true, offsetY: 28, fontSize: "12px", color: "#5A6560" },
                    value: { show: true, offsetY: -12, fontSize: "30px", fontWeight: 800, color: "#0F1512", formatter: (v: number) => `${v}%` },
                  },
                },
              },
              stroke: { lineCap: "round" },
              labels: ["of students placed"],
            }}
          />
        </Panel>

        <section className="card lg:col-span-2" style={{ padding: "24px", borderRadius: "14px", minWidth: 0 }}>
          <div className="grid grid-cols-2" style={{ gap: "28px 24px", height: "100%", alignContent: "center" }}>
            <Stat label="Students placed" value={String(placements.length)} delta={placedDelta} caption={placedDelta ? undefined : "This academic cycle"} />
            <Stat label="Average package" value={fmtLPA(avgPackage)} caption={`Highest ${fmtLPA(highestPackage)}`} />
            <Stat label="Companies recruiting" value={String(companiesRecruiting.size)} caption={`${applications.length} applications received`} />
            <Stat label="Active drives" value={String(activeDrives.length)} caption={`${upcomingDrives.length} with an open deadline`} />
          </div>
        </section>

        {/* ── Row 2: over time + pipeline ── */}
        <Panel title="Placements over time" subtitle="Last 12 months" className="lg:col-span-2">
          {!hasPlacements ? (
            <ChartEmptyState message="Trend appears once placements are recorded." />
          ) : (
            <ApexChart
              type="area"
              height={CHART_HEIGHT}
              series={[{ name: "Placements", data: placementsByMonth }]}
              options={{
                ...BASE_CHART_OPTIONS,
                chart: { ...BASE_CHART_OPTIONS.chart, type: "area", zoom: { enabled: false } },
                colors: [GRADIENT_FROM],
                stroke: { curve: "smooth", width: 2 },
                fill: { type: "gradient", gradient: { type: "vertical", gradientToColors: [GRADIENT_TO], opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
                markers: { size: 0, hover: { size: 5 } },
                xaxis: {
                  categories: monthKeys.map(monthLabel),
                  labels: { style: { fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true },
                  axisBorder: { color: AXIS },
                  axisTicks: { show: false },
                  tooltip: { enabled: false },
                },
                yaxis: { labels: { style: { fontSize: "11px" }, formatter: (v: number) => String(Math.round(v)) }, min: 0, forceNiceScale: true },
                tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} placement${v === 1 ? "" : "s"}` } },
              }}
            />
          )}
        </Panel>

        <Panel title="Application funnel" subtitle="Where every application stands">
          {applications.length === 0 ? (
            <ChartEmptyState message="Appears once students start applying to drives." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "4px" }}>
              {funnelStages.map((stage, i) => {
                const prev = i > 0 ? funnelStages[i - 1].value : 0;
                const conversion = i > 0 && prev > 0 ? `${Math.round((stage.value / prev) * 100)}%` : undefined;
                return (
                  <BarRow key={stage.label} label={stage.label} value={String(stage.value)} note={conversion} pct={(stage.value / funnelMax) * 100} color={FUNNEL_COLORS[i]} />
                );
              })}
            </div>
          )}
        </Panel>

        {/* ── Row 3: breakdowns ── */}
        <Panel title="Package distribution" subtitle="Students per salary band (LPA)">
          {!hasPlacements ? (
            <ChartEmptyState message="Appears once placements are recorded." />
          ) : (
            <ApexChart
              type="bar"
              height={CHART_HEIGHT}
              series={[{ name: "Students", data: packageDistribution.map(b => b.count) }]}
              options={{
                ...BASE_CHART_OPTIONS,
                chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                // One colour per salary band, labelled on the axis and above each bar.
                colors: CATEGORICAL.slice(0, PACKAGE_BANDS.length),
                legend: { show: false },
                plotOptions: { bar: { distributed: true, columnWidth: "58%", borderRadius: 4, borderRadiusApplication: "end", dataLabels: { position: "top" } } },
                dataLabels: {
                  enabled: true, offsetY: -18,
                  style: { colors: ["#0F1512"], fontSize: "11px", fontWeight: 600 },
                  formatter: (v: number) => (v > 0 ? String(v) : ""),
                },
                xaxis: { categories: packageDistribution.map(b => b.label), labels: { style: { fontSize: "11px" } }, axisBorder: { color: AXIS }, axisTicks: { show: false } },
                yaxis: { show: false, min: 0, forceNiceScale: true },
                grid: { ...BASE_CHART_OPTIONS.grid, yaxis: { lines: { show: false } } },
                tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} student${v === 1 ? "" : "s"}` } },
              }}
            />
          )}
        </Panel>

        <Panel title="Top recruiters" subtitle="Share of students hired">
          {recruiterSlices.length === 0 ? (
            <ChartEmptyState message="No students placed yet." />
          ) : (
            <ApexChart
              type="donut"
              height={CHART_HEIGHT}
              series={recruiterSlices.map(s => s.value)}
              options={{
                chart: { fontFamily: "inherit" },
                labels: recruiterSlices.map(s => s.label),
                colors: recruiterSlices.map(s => s.color),
                legend: { show: true, position: "right", fontSize: "12px", labels: { colors: "#5A6560" }, markers: { size: 5 } },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ["#fff"] },
                tooltip: { y: { formatter: (v: number) => `${v} hired` } },
                plotOptions: {
                  pie: {
                    donut: {
                      size: "70%",
                      labels: {
                        show: true,
                        value: { fontSize: "22px", fontWeight: 800, color: "#0F1512", offsetY: 2 },
                        total: { show: true, label: "Hired", fontSize: "12px", color: "#5A6560" },
                      },
                    },
                  },
                },
                responsive: [{ breakpoint: 520, options: { legend: { position: "bottom" } } }],
              }}
            />
          )}
        </Panel>

        <Panel title="Departments" subtitle="Placement rate by department">
          {departmentStats.length === 0 ? (
            <ChartEmptyState message="Appears once students are assigned to departments." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "4px" }}>
              {departmentStats.map(d => (
                <BarRow key={d.department} label={d.department} value={`${d.rate}%`} note={`${d.placed}/${d.total}`} pct={d.rate} color={departmentColor.get(d.department) ?? OTHER} />
              ))}
            </div>
          )}
        </Panel>

        {/* ── Row 4: what's next ── */}
        <Panel
          title="Upcoming drives"
          subtitle="Open for applications, soonest deadline first"
          className="lg:col-span-3"
          action={
            <button className="btn" onClick={onViewAllDrives} style={{ flexShrink: 0 }}>
              <ExternalLink size={14} /> View all
            </button>
          }
        >
          {upcomingDrives.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              No drives with an open deadline right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: "10px" }}>
              {upcomingDrives.slice(0, 6).map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: "1px solid var(--border)", borderRadius: "10px", minWidth: 0 }}>
                  <CompanyLogo name={d.company_name} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.company_name}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: BLUE }}>{fmtDeadline(d.application_deadline!)}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{d.applicant_count} registered</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
