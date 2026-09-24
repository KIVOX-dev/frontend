"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { motion } from "framer-motion";
import {
  TrendingUp, Briefcase, Building2, IndianRupee,
  FileSpreadsheet, RefreshCw, Download, Plus, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, UserPlus, ExternalLink,
} from "./dazzleIcons";
import { toast } from "@/lib/toast";
import {
  type User, type Placement, type Drive, type Department, type StudentRecord, type PlacementApplication,
  BASE_CHART_OPTIONS, ChartEmptyState, SectionError, CompanyLogo, monthKey, monthLabel,
} from "./collegeAdminShared";

// ApexCharts touches `window` at import time — never during SSR (matches the
// same guard CollegeAdminDashboard.tsx uses for its own charts).
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Single brand blue, two shades — the whole point of this redesign's color
// rule ("brand color for positive, avoid random colors"). Matches the
// Coursera-parity primary blue (#0056D2) every other screen now uses, so
// this stays visually consistent with the rest of the app rather than
// introducing a second theme. Names kept as GREEN_* to avoid touching every
// call site below — they're brand-accent tokens, not literally green.
const GREEN = "#0056D2";
const GREEN_DARK = "#0B408B";
const GREEN_SOFT = "#87B8FF";
const GREEN_MED = "#5B9DFC";
const GREEN_TINT = "rgba(0, 86, 210, .10)";
const RED = "#dc2626";
const SLATE = "#94a3b8";

// A distinct color per KPI card — one glance tells them apart, instead of
// eight identical blue chips. Each has a matching ~10%-alpha tint for the
// icon backdrop.
const KPI_COLORS = {
  blue: { accent: "#0056D2", tint: "rgba(0, 86, 210, .12)" },
  emerald: { accent: "#16A34A", tint: "rgba(22, 163, 74, .12)" },
  amber: { accent: "#D97706", tint: "rgba(217, 119, 6, .12)" },
  violet: { accent: "#7C3AED", tint: "rgba(124, 58, 237, .12)" },
  teal: { accent: "#0D9488", tint: "rgba(13, 148, 136, .12)" },
  rose: { accent: "#E11D48", tint: "rgba(225, 29, 72, .12)" },
};

const PACKAGE_BANDS = [
  { label: "0–3", min: 0, max: 3 },
  { label: "3–5", min: 3, max: 5 },
  { label: "5–8", min: 5, max: 8 },
  { label: "8–12", min: 8, max: 12 },
  { label: "12–20", min: 12, max: 20 },
  { label: "20+", min: 20, max: Infinity },
];

// Ordered so a later stage implies every earlier one — what makes a cumulative
// funnel from a single "current status" field meaningful (see PlacementDashboard
// section of the plan: there's no separate "reached shortlisted then advanced"
// history, only where each application currently sits).
const STATUS_ORDER = ["applied", "shortlisted", "interview", "selected"];

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  // Indian academic year convention: starts ~June/July.
  const startYear = now.getMonth() >= 5 ? y : y - 1;
  return `${startYear}–${String(startYear + 1).slice(2)}`;
}

function last6MonthKeys(): string[] {
  const keys: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 5; i >= 0; i--) {
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
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────
// KPI card
// ─────────────────────────────────────────────────────────────────────────

type KpiDelta = { direction: "up" | "down"; text: string } | null;

function KpiCard({
  icon: Icon, label, value, caption, delta, sparkline, accent = GREEN, tint = GREEN_TINT,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  caption?: string;
  delta?: KpiDelta;
  sparkline?: number[];
  accent?: string;
  /** Soft background wash behind the icon — a distinct color per card is
      what makes a grid of KPI cards read as "colorful" instead of a wall
      of identical blue chips. */
  tint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(15, 23, 20, 0.10)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: "18px", borderRadius: "14px", cursor: "default", borderTop: `3px solid ${accent}` }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ width: 42, height: 42, borderRadius: "12px", background: tint, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} />
        </div>
        {sparkline && sparkline.some(v => v > 0) && (
          <div style={{ width: 72, height: 32 }}>
            <ApexChart
              type="line"
              height={32}
              width={72}
              series={[{ data: sparkline }]}
              options={{
                chart: { sparkline: { enabled: true }, animations: { enabled: false } },
                stroke: { curve: "smooth", width: 2 },
                colors: [accent],
                tooltip: { enabled: false },
              }}
            />
          </div>
        )}
      </div>
      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{value}</span>
        {delta && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", fontWeight: 700, color: delta.direction === "up" ? GREEN_DARK : RED }}>
            {delta.direction === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta.text}
          </span>
        )}
      </div>
      {caption && <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>{caption}</div>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Placement funnel — custom (ApexCharts has no first-class funnel type);
// decreasing-width bars with conversion % labels between stages.
// ─────────────────────────────────────────────────────────────────────────

// A tabbed card — switches between several related charts/views inside one
// box instead of giving each its own permanent card. This is the actual
// "too many cards" fix: nine always-visible chart cards folds down to four
// tabbed ones, so every chart is still reachable, just not all on screen
// competing for attention at once.
function TabCard({ tabs, defaultTab = 0 }: { tabs: { label: string; content: React.ReactNode }[]; defaultTab?: number }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            style={{
              padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer",
              background: active === i ? "var(--ink)" : "var(--bg)",
              color: active === i ? "#fff" : "var(--muted)",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active].content}
    </div>
  );
}

function PlacementFunnel({ stages }: { stages: { label: string; value: number }[] }) {
  const max = Math.max(1, ...stages.map(s => s.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {stages.map((stage, i) => {
        const widthPct = Math.max(8, (stage.value / max) * 100);
        const prev = i > 0 ? stages[i - 1].value : null;
        const conversion = prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;
        return (
          <div key={stage.label}>
            {conversion !== null && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                ↓ {conversion}%
              </div>
            )}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: "center",
                width: `${widthPct}%`,
                margin: "0 auto",
                background: `linear-gradient(90deg, ${GREEN_DARK}, ${GREEN})`,
                borderRadius: "8px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fff",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{stage.label}</span>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>{stage.value}</span>
            </motion.div>
          </div>
        );
      })}
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
  const [deptSort, setDeptSort] = useState<"rate" | "count" | "package">("rate");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const totalStudents = useMemo(() => users.filter(u => u.role === "student").length, [users]);

  const activeDrives = useMemo(
    () => drives.filter(d => ["open", "active"].includes(d.status)),
    [drives]
  );

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
  const highestPackage = useMemo(
    () => placements.reduce((max, p) => Math.max(max, p.salary_lpa || 0), 0),
    [placements]
  );

  const placementRate = totalStudents > 0 ? (placements.length / totalStudents) * 100 : 0;

  // ── Month-over-month deltas — only for metrics with an honest time series ──
  const monthKeys6 = useMemo(() => last6MonthKeys(), []);
  const thisMonthKey = monthKeys6[5];
  const prevMonthKey = monthKeys6[4];

  function deltaFor(items: { created_at?: string }[]): KpiDelta {
    const curr = items.filter(i => monthKey(i.created_at) === thisMonthKey).length;
    const prev = items.filter(i => monthKey(i.created_at) === prevMonthKey).length;
    if (prev === 0) return null; // no honest baseline to compare against
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (pct === 0) return null;
    return { direction: pct > 0 ? "up" : "down", text: `${Math.abs(pct)}% vs last month` };
  }

  const placementsSpark = useMemo(() => monthlyCounts(placements, monthKeys6), [placements, monthKeys6]);
  const applicationsSpark = useMemo(() => monthlyCounts(applications, monthKeys6), [applications, monthKeys6]);

  // ── Chart data ──
  const placementTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of placements) {
      const key = monthKey(p.created_at) ?? "Unknown";
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ month: key === "Unknown" ? key : monthLabel(key), count }));
  }, [placements]);

  const packageTrend = useMemo(() => {
    const byMonth = new Map<string, number[]>();
    for (const p of placements) {
      const key = monthKey(p.created_at) ?? "Unknown";
      const arr = byMonth.get(key) || [];
      arr.push(p.salary_lpa || 0);
      byMonth.set(key, arr);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, arr]) => ({
        month: key === "Unknown" ? key : monthLabel(key),
        avg: arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0,
        max: arr.length ? Math.max(...arr) : 0,
      }));
  }, [placements]);

  const departmentStats = useMemo(() => {
    const deptNameById = new Map(departments.map(d => [d.id, d.name]));
    const deptIdByStudentRecordId = new Map(studentRecords.map(s => [s.id, s.department_id]));

    const totalByDept = new Map<string, number>();
    for (const s of studentRecords) {
      if (!s.department_id) continue;
      totalByDept.set(s.department_id, (totalByDept.get(s.department_id) || 0) + 1);
    }

    const placedByDept = new Map<string, { count: number; salarySum: number }>();
    for (const p of placements) {
      const deptId = deptIdByStudentRecordId.get(p.student_id);
      if (!deptId) continue;
      const entry = placedByDept.get(deptId) || { count: 0, salarySum: 0 };
      entry.count += 1;
      entry.salarySum += p.salary_lpa || 0;
      placedByDept.set(deptId, entry);
    }

    const rows = Array.from(placedByDept.entries()).map(([deptId, { count, salarySum }]) => {
      const total = totalByDept.get(deptId) || count;
      return {
        department: deptNameById.get(deptId) || "Unknown",
        placed: count,
        total,
        rate: total ? Math.round((count / total) * 1000) / 10 : 0,
        avgPackage: count ? Math.round((salarySum / count) * 10) / 10 : 0,
      };
    });

    const sortFn = deptSort === "rate" ? (a: typeof rows[0], b: typeof rows[0]) => b.rate - a.rate
      : deptSort === "count" ? (a: typeof rows[0], b: typeof rows[0]) => b.placed - a.placed
      : (a: typeof rows[0], b: typeof rows[0]) => b.avgPackage - a.avgPackage;

    return rows.sort(sortFn).slice(0, 8);
  }, [placements, studentRecords, departments, deptSort]);

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
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [placements]);

  const funnelStages = useMemo(() => {
    const rank = (s: string) => STATUS_ORDER.indexOf(s);
    const active = applications.filter(a => a.status !== "rejected" && a.status !== "withdrawn");
    return [
      { label: "Applications", value: applications.length },
      { label: "Shortlisted", value: active.filter(a => rank(a.status) >= rank("shortlisted")).length },
      { label: "Interviewed", value: active.filter(a => rank(a.status) >= rank("interview")).length },
      { label: "Selected", value: active.filter(a => rank(a.status) >= rank("selected")).length },
      { label: "Joined", value: placements.length },
    ];
  }, [applications, placements]);

  const statusDistribution = useMemo(() => {
    const counts = { applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 };
    for (const a of applications) {
      if (a.status === "withdrawn") counts.rejected += 1;
      else if (a.status in counts) counts[a.status as keyof typeof counts] += 1;
    }
    return [
      { label: "Applied", value: counts.applied, color: SLATE },
      { label: "Shortlisted", value: counts.shortlisted, color: GREEN_SOFT },
      { label: "Interview", value: counts.interview, color: GREEN_MED },
      { label: "Selected", value: counts.selected, color: GREEN },
      { label: "Rejected", value: counts.rejected, color: RED },
    ];
  }, [applications]);

  const packageDistribution = useMemo(
    () => PACKAGE_BANDS.map(band => ({
      label: band.label,
      count: placements.filter(p => (p.salary_lpa || 0) >= band.min && (p.salary_lpa || 0) < band.max).length,
    })),
    [placements]
  );

  const monthlyApplications = useMemo(() => {
    const byMonth = new Map<string, { inProgress: number; selected: number; rejected: number }>();
    for (const a of applications) {
      const key = monthKey(a.created_at) ?? "Unknown";
      const entry = byMonth.get(key) || { inProgress: 0, selected: 0, rejected: 0 };
      if (a.status === "selected") entry.selected += 1;
      else if (a.status === "rejected" || a.status === "withdrawn") entry.rejected += 1;
      else entry.inProgress += 1;
      byMonth.set(key, entry);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ month: key === "Unknown" ? key : monthLabel(key), ...v }));
  }, [applications]);

  const recentActivities = useMemo(() => {
    const userByStudentRecordId = new Map<string, User>();
    const userById = new Map(users.map(u => [String(u.id), u]));
    for (const s of studentRecords) {
      const u = userById.get(String(s.user_id));
      if (u) userByStudentRecordId.set(s.id, u);
    }
    const driveById = new Map(drives.map(d => [String(d.id), d]));

    type Activity = { id: string; icon: React.ComponentType<{ size?: number }>; text: string; created_at?: string };
    const items: Activity[] = [
      ...placements.map(p => ({
        id: `pr-${p.id}`,
        icon: CheckCircle2,
        text: `${userByStudentRecordId.get(p.student_id)?.name || "A student"} reported a placement at ${p.company_name}`,
        created_at: p.created_at,
      })),
      ...applications.slice(-50).map(a => ({
        id: `app-${a.id}`,
        icon: UserPlus,
        text: `${userByStudentRecordId.get(a.student_id)?.name || "A student"} applied to ${driveById.get(a.placement_id)?.title || "a drive"}`,
        created_at: a.created_at,
      })),
      ...drives.map(d => ({
        id: `drive-${d.id}`,
        icon: Briefcase,
        text: `${d.title} drive posted for ${d.company_name}`,
        created_at: d.created_at,
      })),
    ];

    return items
      .filter(i => i.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 8);
  }, [placements, applications, drives, users, studentRecords]);

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

  return (
    <div ref={dashboardRef}>
      {/* ── Header ── */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 5, background: "var(--bg)",
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
          gap: "12px", padding: "4px 0 16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "2px" }}>
            Placement Dashboard
          </h2>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Academic year {currentAcademicYear()} · Last updated {lastUpdated ? fmtRelative(lastUpdated.toISOString()) : "—"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn btn-p" onClick={onCreateDrive}>
            <Plus size={14} /> Create Drive
          </button>
          <button className="btn" onClick={onViewAllDrives}>
            <ExternalLink size={14} /> View All Drives
          </button>
          <button className="btn" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
          </button>
          <button className="btn" onClick={handleExportExcel} disabled={isExporting !== null}>
            <FileSpreadsheet size={14} /> {isExporting === "excel" ? "Exporting…" : "Excel"}
          </button>
          <button className="btn" onClick={handleExportPdf} disabled={isExporting !== null}>
            <Download size={14} /> {isExporting === "pdf" ? "Exporting…" : "PDF"}
          </button>
        </div>
      </div>

      {/* ── Load errors ──
          KPIs/charts below are computed from whatever data each resource
          last successfully loaded (possibly stale, possibly empty) — this
          banner is what tells the admin some of that data failed to
          refresh, so the numbers below aren't silently misrepresented as
          "there's genuinely nothing here". */}
      {failedResources.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <SectionError
            message={`Some dashboard data failed to load: ${failedResources.map(([, message]) => message).join(" ")}`}
            onRetry={onRefresh}
          />
        </div>
      )}

      {/* ── KPI cards ── six, not eight: Highest Package folds into Average
          Package's caption and Upcoming Drives folds into Active Drives',
          since each pair told half of one story anyway. Each card gets its
          own color (see KPI_COLORS) instead of one repeated blue chip. */}
      <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: "14px", marginBottom: "20px" }}>
        <KpiCard
          icon={CheckCircle2} label="Students Placed" value={String(placements.length)}
          delta={deltaFor(placements)} sparkline={placementsSpark}
          accent={KPI_COLORS.blue.accent} tint={KPI_COLORS.blue.tint}
        />
        <KpiCard
          icon={TrendingUp} label="Placement Rate" value={`${placementRate.toFixed(1)}%`}
          caption={`${placements.length} of ${totalStudents} students`}
          accent={KPI_COLORS.emerald.accent} tint={KPI_COLORS.emerald.tint}
        />
        <KpiCard
          icon={FileSpreadsheet} label="Applications Received" value={String(applications.length)}
          delta={deltaFor(applications)} sparkline={applicationsSpark}
          accent={KPI_COLORS.amber.accent} tint={KPI_COLORS.amber.tint}
        />
        <KpiCard
          icon={Building2} label="Companies Recruiting" value={String(companiesRecruiting.size)}
          caption="Distinct recruiters"
          accent={KPI_COLORS.violet.accent} tint={KPI_COLORS.violet.tint}
        />
        <KpiCard
          icon={IndianRupee} label="Average Package" value={fmtLPA(avgPackage)}
          caption={`Highest ${fmtLPA(highestPackage)}`}
          accent={KPI_COLORS.teal.accent} tint={KPI_COLORS.teal.tint}
        />
        <KpiCard
          icon={Briefcase} label="Active Drives" value={String(activeDrives.length)}
          caption={`${upcomingDrives.length} upcoming`}
          accent={KPI_COLORS.rose.accent} tint={KPI_COLORS.rose.tint}
        />
      </div>

      {/* ── Four tabbed cards instead of nine permanent ones — every chart
          below is still one click away, just not all competing for space
          on screen at once. ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "14px", marginBottom: "14px" }}>
        <TabCard
          tabs={[
            {
              label: "Placements",
              content: placementTrend.length === 0 ? (
                <ChartEmptyState message="Trend appears once placements are recorded." />
              ) : (
                <ApexChart
                  type="line"
                  height={240}
                  series={[{ name: "Placements", data: placementTrend.map(t => t.count) }]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "line" },
                    colors: [GREEN],
                    stroke: { curve: "smooth", width: 3 },
                    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0, stops: [0, 90, 100] } },
                    markers: { size: 4, colors: [GREEN], strokeWidth: 0 },
                    xaxis: { categories: placementTrend.map(t => t.month), labels: { style: { fontSize: "12px" } }, axisBorder: { color: "#C3C2B7" } },
                    yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true, min: 0 },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} placement${v === 1 ? "" : "s"}` } },
                  }}
                />
              ),
            },
            {
              label: "Packages",
              content: packageTrend.length === 0 ? (
                <ChartEmptyState message="Trend appears once placements are recorded." />
              ) : (
                <ApexChart
                  type="area"
                  height={240}
                  series={[
                    { name: "Average (LPA)", data: packageTrend.map(t => t.avg) },
                    { name: "Highest (LPA)", data: packageTrend.map(t => t.max) },
                  ]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "area" },
                    colors: [GREEN, GREEN_DARK],
                    stroke: { curve: "smooth", width: 2 },
                    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
                    legend: { show: true, position: "top", horizontalAlign: "right", fontSize: "12px" },
                    xaxis: { categories: packageTrend.map(t => t.month), labels: { style: { fontSize: "12px" } }, axisBorder: { color: "#C3C2B7" } },
                    yaxis: { labels: { style: { fontSize: "12px" }, formatter: (v: number) => `${v}` }, forceNiceScale: true, min: 0 },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} LPA` } },
                  }}
                />
              ),
            },
            {
              label: "Applications",
              content: monthlyApplications.length === 0 ? (
                <ChartEmptyState message="Appears once students start applying to drives." />
              ) : (
                <ApexChart
                  type="area"
                  height={240}
                  series={[
                    { name: "In progress", data: monthlyApplications.map(m => m.inProgress) },
                    { name: "Selected", data: monthlyApplications.map(m => m.selected) },
                    { name: "Rejected", data: monthlyApplications.map(m => m.rejected) },
                  ]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "area", stacked: true },
                    colors: [SLATE, GREEN, RED],
                    stroke: { curve: "smooth", width: 1.5 },
                    fill: { type: "gradient", gradient: { opacityFrom: 0.5, opacityTo: 0.15 } },
                    legend: { show: true, position: "top", horizontalAlign: "right", fontSize: "12px" },
                    xaxis: { categories: monthlyApplications.map(m => m.month), labels: { style: { fontSize: "12px" } }, axisBorder: { color: "#C3C2B7" } },
                    yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true, min: 0 },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v}` } },
                  }}
                />
              ),
            },
          ]}
        />

        <TabCard
          tabs={[
            {
              label: "Departments",
              content: (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                    <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", padding: "2px" }}>
                      {(["rate", "count", "package"] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDeptSort(mode)}
                          style={{
                            padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer",
                            background: deptSort === mode ? "var(--ink)" : "transparent",
                            color: deptSort === mode ? "#fff" : "var(--muted)",
                          }}
                        >
                          {mode === "rate" ? "Rate" : mode === "count" ? "Placed" : "Package"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {departmentStats.length === 0 ? (
                    <ChartEmptyState message="Appears once a placed student's department is known." />
                  ) : (
                    <ApexChart
                      type="bar"
                      height={240}
                      series={[{ name: deptSort === "rate" ? "Placement %" : deptSort === "count" ? "Students placed" : "Avg package (LPA)", data: departmentStats.map(d => deptSort === "rate" ? d.rate : deptSort === "count" ? d.placed : d.avgPackage) }]}
                      options={{
                        ...BASE_CHART_OPTIONS,
                        chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                        colors: [GREEN],
                        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
                        dataLabels: { enabled: true, style: { colors: ["#0F1512"], fontSize: "12px", fontWeight: 600 }, formatter: (v: number) => deptSort === "rate" ? `${v}%` : deptSort === "package" ? `${v}` : `${v}`, offsetX: 6, background: { enabled: false } },
                        xaxis: { categories: departmentStats.map(d => d.department), labels: { style: { fontSize: "12px" } }, axisBorder: { color: "#C3C2B7" } },
                        yaxis: { labels: { style: { fontSize: "12px" } } },
                        tooltip: {
                          ...BASE_CHART_OPTIONS.tooltip,
                          y: { formatter: (v: number, opts) => {
                            const d = opts ? departmentStats[opts.dataPointIndex] : undefined;
                            return d ? `${d.placed}/${d.total} placed · ${d.rate}% · avg ${d.avgPackage} LPA` : `${v}`;
                          } },
                        },
                      }}
                    />
                  )}
                </>
              ),
            },
            {
              label: "Companies",
              content: companyLeaderboard.length === 0 ? (
                <ChartEmptyState message="No students placed yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {companyLeaderboard.map((c, i) => (
                    <div key={c.company} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ width: "18px", fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>{i + 1}</span>
                      <CompanyLogo name={c.company} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.company}</div>
                        <div style={{ height: "6px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden", marginTop: "3px" }}>
                          <div style={{ height: "100%", width: `${(c.count / companyLeaderboard[0].count) * 100}%`, background: `linear-gradient(90deg, ${GREEN_DARK}, ${GREEN})`, borderRadius: "3px" }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{c.count} hired</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{c.avgPackage} LPA avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "14px", marginBottom: "14px" }}>
        <TabCard
          tabs={[
            {
              label: "Funnel",
              content: applications.length === 0 ? (
                <ChartEmptyState message="Appears once students start applying to drives." />
              ) : (
                <PlacementFunnel stages={funnelStages} />
              ),
            },
            {
              label: "Status",
              content: applications.length === 0 ? (
                <ChartEmptyState message="Appears once students start applying to drives." />
              ) : (
                <ApexChart
                  type="donut"
                  height={240}
                  series={statusDistribution.map(s => s.value)}
                  options={{
                    labels: statusDistribution.map(s => s.label),
                    colors: statusDistribution.map(s => s.color),
                    legend: { show: true, position: "bottom", fontSize: "12px" },
                    dataLabels: { enabled: true, style: { fontSize: "11px", fontWeight: 600 } },
                    stroke: { show: true, width: 2, colors: ["var(--surface)"] },
                    tooltip: { y: { formatter: (v: number) => `${v} application${v === 1 ? "" : "s"}` } },
                    plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: "Total", fontSize: "13px" } } } } },
                  }}
                />
              ),
            },
            {
              label: "By Package",
              content: placements.length === 0 ? (
                <ChartEmptyState message="Appears once placements are recorded." />
              ) : (
                <ApexChart
                  type="bar"
                  height={240}
                  series={[{ name: "Students", data: packageDistribution.map(b => b.count) }]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                    colors: [GREEN],
                    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
                    dataLabels: { enabled: true, style: { colors: ["#0F1512"], fontSize: "12px", fontWeight: 600 }, offsetY: -20, background: { enabled: false } },
                    xaxis: { categories: packageDistribution.map(b => `${b.label} LPA`), labels: { style: { fontSize: "12px" } }, axisBorder: { color: "#C3C2B7" } },
                    yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true, min: 0 },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} student${v === 1 ? "" : "s"}` } },
                  }}
                />
              ),
            },
          ]}
        />

        <TabCard
          tabs={[
            {
              label: "Upcoming Drives",
              content: upcomingDrives.length === 0 ? (
                <ChartEmptyState message="No drives with an open deadline right now." />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px" }}>
                        <th style={{ padding: "8px" }}>Company</th>
                        <th style={{ padding: "8px" }}>Role</th>
                        <th style={{ padding: "8px" }}>Deadline</th>
                        <th style={{ padding: "8px" }}>Registrations</th>
                        <th style={{ padding: "8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingDrives.slice(0, 6).map(d => (
                        <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <CompanyLogo name={d.company_name} size={20} />
                              {d.company_name}
                            </div>
                          </td>
                          <td style={{ padding: "8px", color: "var(--muted)" }}>{d.title}</td>
                          <td style={{ padding: "8px", color: "var(--muted)" }}>{new Date(d.application_deadline!).toLocaleDateString()}</td>
                          <td style={{ padding: "8px" }}>{d.applicant_count}</td>
                          <td style={{ padding: "8px" }}>
                            <span style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: GREEN_TINT, color: GREEN_DARK, textTransform: "capitalize" }}>{d.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              label: "Recent Activity",
              content: recentActivities.length === 0 ? (
                <ChartEmptyState message="Activity appears as drives, applications, and placements happen." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {recentActivities.map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "8px", background: GREEN_TINT, color: GREEN_DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <a.icon size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", color: "var(--text)" }}>{a.text}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <Clock size={10} /> {fmtRelative(a.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
