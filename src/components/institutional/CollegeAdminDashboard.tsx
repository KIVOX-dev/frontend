"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { getDepartmentOptions } from "@/lib/departmentCatalog";

// ApexCharts touches `window` at import time, so it must never run during SSR.
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  created_at?: string;
};

type Assessment = {
  id: number;
  title: string;
  assessment_type: string;
  status: string;
  difficulty: string;
  duration_minutes: number;
  total_marks: number;
  created_at: string;
};

type Placement = {
  id: number;
  student_id: number;
  college_id: number;
  company_name: string;
  role: string;
  salary_lpa: number;
  work_type: string;
  mode: string;
  location?: string;
  status: string;
  verification_status: string;
  created_at?: string;
};

type Drive = {
  id: number;
  title: string;
  company_name: string;
  location?: string;
  job_type: string;
  status: string;
  application_deadline?: string;
  created_at?: string;
  applicant_count: number;
};

// Single accent hue for the trend line — it's genuinely one series over time,
// so sequential/single-hue is the correct color job there (not a simplification).
const CHART_COLOR = "#0F6B4F";

// Categorical palette for the Company/Drive bar charts, where each bar IS a
// distinct named entity — identity is the job, so per-bar color is correct
// there, unlike the single-series trend line above. Deeper/richer "corporate"
// tones rather than the bright default — order and hexes re-validated for this
// app (node scripts/validate_palette.js in the dataviz skill, --mode light):
// lightness band, chroma floor, contrast all PASS; one adjacent CVD pair
// (olive↔berry) sits in the legal 6–8 WARN band, which requires direct labels
// as the secondary encoding — already on via dataLabels below.
const CATEGORICAL = ["#1f5c8f", "#b8632f", "#0d8c76", "#b98a2e", "#a13d5c", "#6b7a2e", "#6a4a94", "#a83a30"];

function colorForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORICAL[hash % CATEGORICAL.length];
}

// Shared look for every chart on this dashboard — thin bars/lines, recessive
// grid, hover tooltip. Merge chart-specific bits (xaxis categories, chart.type,
// colors) into this per instance rather than duplicating the whole spec.
const BASE_CHART_OPTIONS: ApexOptions = {
  chart: { toolbar: { show: false }, fontFamily: "inherit", foreColor: "#5A6560" },
  grid: { borderColor: "#E7EBE9", strokeDashArray: 3 },
  dataLabels: { enabled: false },
  tooltip: { theme: "light" },
  legend: { show: false },
};

// No official domain/logo field exists on a placement or drive — company is
// free text a college admin typed in. So a "real" logo means: guess a domain,
// ask a third-party logo service for it, and fall back to a colored initials
// badge when the guess is wrong or the service has nothing. This is
// best-effort, not authoritative — see the caveat where it's wired in.
const KNOWN_DOMAINS: Record<string, string> = {
  tcs: "tcs.com",
  "tata consultancy services": "tcs.com",
  infosys: "infosys.com",
  wipro: "wipro.com",
  zoho: "zoho.com",
  accenture: "accenture.com",
  cognizant: "cognizant.com",
  capgemini: "capgemini.com",
  ibm: "ibm.com",
  microsoft: "microsoft.com",
  google: "google.com",
  amazon: "amazon.com",
  deloitte: "deloitte.com",
  hcl: "hcltech.com",
  "hcl technologies": "hcltech.com",
  "tech mahindra": "techmahindra.com",
  mindtree: "mindtree.com",
  flipkart: "flipkart.com",
};

function guessDomain(companyName: string): string | null {
  const key = companyName.trim().toLowerCase();
  if (!key) return null;
  if (KNOWN_DOMAINS[key]) return KNOWN_DOMAINS[key];
  const slug = key.replace(/[^a-z0-9]+/g, "");
  return slug ? `${slug}.com` : null;
}

function CompanyLogo({ name, size = 28 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const domain = guessDomain(name);
  const color = colorForKey(name);
  const initials = name.trim().slice(0, 2).toUpperCase() || "?";

  if (!domain || failed) {
    return (
      <div
        title={name}
        style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`https://unavatar.io/${domain}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "contain", background: "#fff", border: "1px solid var(--border)", flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}

function monthKey(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "14px", textAlign: "center", padding: "0 24px" }}>
      {message}
    </div>
  );
}

export function CollegeAdminDashboard() {
  const { user: currentUser } = useAuthStore();
  const { activeScreen } = useUiStore();
  const departmentOptions = getDepartmentOptions(currentUser?.college_name);
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalFaculty: 0, totalAssessments: 0 });
  const [loading, setLoading] = useState(false);

  // Create user form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "student", department: "" });
  const [createMsg, setCreateMsg] = useState("");

  // Add placement form
  const [showAddPlacement, setShowAddPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({ student_id: "", company_name: "", role: "", salary_lpa: "", work_type: "onsite", mode: "campus", location: "" });
  const [placementMsg, setPlacementMsg] = useState("");

  // Post drive form
  const [showPostDrive, setShowPostDrive] = useState(false);
  const [driveForm, setDriveForm] = useState({ title: "", company_name: "", location: "", job_type: "full_time", salary_min_lpa: "", salary_max_lpa: "", application_deadline: "", eligible_departments: [] as string[] });
  const [driveMsg, setDriveMsg] = useState("");

  // Assessment form
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ title: "", description: "", assessment_type: "aptitude", difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40, status: "active", target_departments: [] as string[] });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIGenerate = async () => {
    if (!assessmentForm.title) {
      alert("Please enter a title first to generate questions.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await api.post("/assessments/generate-questions", {
        title: assessmentForm.title,
        type: assessmentForm.assessment_type,
        difficulty: assessmentForm.difficulty
      });
      setAssessmentForm(prev => ({ ...prev, description: JSON.stringify(res.data) }));
    } catch (err) {
      alert("Failed to generate AI questions.");
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      // Filter out college admins so they don't see themselves in the Manage Users table
      const filteredUsers = res.data.filter((u: User) => u.role !== "college_admin" && u.role !== "institution_admin");
      setUsers(filteredUsers);
      const students = res.data.filter((u: User) => u.role === "student").length;
      const faculty = res.data.filter((u: User) => u.role === "faculty").length;
      setStats(prev => ({ ...prev, totalUsers: res.data.length, totalStudents: students, totalFaculty: faculty }));
    } catch (err) { console.error(err); }
  };

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/assessments");
      setAssessments(res.data);
      setStats(prev => ({ ...prev, totalAssessments: res.data.length }));
    } catch (err) { console.error(err); }
  };

  const fetchPlacements = async () => {
    try {
      const res = await api.get("/placements");
      setPlacements(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchDrives = async () => {
    try {
      const res = await api.get("/jobs/drives");
      setDrives(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
    fetchAssessments();
    fetchPlacements();
    fetchDrives();
  }, []);

  const studentsById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const companyStats = useMemo(() => {
    const byCompany = new Map<string, { company: string; count: number; totalSalary: number }>();
    for (const p of placements) {
      const entry = byCompany.get(p.company_name) || { company: p.company_name, count: 0, totalSalary: 0 };
      entry.count += 1;
      entry.totalSalary += p.salary_lpa || 0;
      byCompany.set(p.company_name, entry);
    }
    return Array.from(byCompany.values())
      .map(c => ({ ...c, avgSalary: c.totalSalary / c.count }))
      .sort((a, b) => b.count - a.count);
  }, [placements]);

  const placementTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of placements) {
      const key = monthKey(p.created_at) ?? "Unknown";
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    }
    // Chronological, oldest first — a trend line read right-to-left backwards
    // in time is unreadable, so sort by the raw sortable key, not insertion order.
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ month: key === "Unknown" ? key : monthLabel(key), count }));
  }, [placements]);

  const driveApplications = useMemo(
    () => [...drives]
      .sort((a, b) => b.applicant_count - a.applicant_count)
      .slice(0, 8)
      .map(d => ({ name: d.title.length > 18 ? d.title.slice(0, 18) + "…" : d.title, applicants: d.applicant_count })),
    [drives]
  );

  const totalApplications = useMemo(() => drives.reduce((sum, d) => sum + d.applicant_count, 0), [drives]);
  const activeDrives = useMemo(() => drives.filter(d => d.status === "active").length, [drives]);

  const handleCreatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacementMsg("");
    try {
      await api.post("/placements", {
        student_id: parseInt(placementForm.student_id),
        company_name: placementForm.company_name,
        role: placementForm.role,
        salary_lpa: parseFloat(placementForm.salary_lpa) || 0,
        work_type: placementForm.work_type,
        mode: placementForm.mode,
        location: placementForm.location || undefined,
      });
      setShowAddPlacement(false);
      setPlacementForm({ student_id: "", company_name: "", role: "", salary_lpa: "", work_type: "onsite", mode: "campus", location: "" });
      fetchPlacements();
    } catch (err: any) {
      setPlacementMsg(err.response?.data?.detail || "Failed to add placement");
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveMsg("");
    try {
      await api.post("/jobs", {
        title: driveForm.title,
        company_name: driveForm.company_name,
        location: driveForm.location || undefined,
        job_type: driveForm.job_type,
        salary_min_lpa: driveForm.salary_min_lpa ? parseFloat(driveForm.salary_min_lpa) : undefined,
        salary_max_lpa: driveForm.salary_max_lpa ? parseFloat(driveForm.salary_max_lpa) : undefined,
        application_deadline: driveForm.application_deadline || undefined,
        eligible_departments: driveForm.eligible_departments.length ? driveForm.eligible_departments : undefined,
      });
      setShowPostDrive(false);
      setDriveForm({ title: "", company_name: "", location: "", job_type: "full_time", salary_min_lpa: "", salary_max_lpa: "", application_deadline: "", eligible_departments: [] });
      fetchDrives();
    } catch (err: any) {
      setDriveMsg(err.response?.data?.detail || "Failed to post drive");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateMsg("");
    try {
      await api.post("/users/", { ...createForm, college_id: currentUser?.college_id });
      setCreateMsg("User created successfully!");
      setCreateForm({ name: "", email: "", password: "", role: "student", department: "" });
      setShowCreateUser(false);
      fetchUsers();
    } catch (err: any) {
      setCreateMsg(err.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch { alert("Failed to delete"); }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/assessments", {
        ...assessmentForm,
        target_departments: assessmentForm.target_departments.length ? assessmentForm.target_departments.join(",") : undefined,
      });
      setShowCreateAssessment(false);
      setAssessmentForm({ title: "", description: "", assessment_type: "aptitude", difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40, status: "active", target_departments: [] });
      fetchAssessments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create assessment");
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Delete this assessment?")) return;
    try {
      await api.delete(`/assessments/${id}`);
      fetchAssessments();
    } catch { alert("Failed to delete"); }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>
          {activeScreen === "placements" ? "Recent Placements" : activeScreen === "drives" ? "Placement Drives" : activeScreen === "users" ? "Manage Users" : "Placement Dashboard"}
        </h2>
        <p style={{ color: "var(--muted)" }}>
          {activeScreen === "placements" ? "Every placement recorded for your institution."
            : activeScreen === "drives" ? "Campus drives posted for your institution, with applicant counts."
              : activeScreen === "users" ? "Add, review, and remove student and faculty accounts."
                : "Overview of your institution’s placements, drives, and companies."}
        </p>
      </div>

      {activeScreen === "dash" && (
        <>
          {/* Placement KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Students Placed", value: placements.length, color: CHART_COLOR },
              { label: "Companies Recruiting", value: companyStats.length, color: "#7c3aed" },
              { label: "Active Drives", value: activeDrives, color: "#0891b2" },
              { label: "Applications Received", value: totalApplications, color: "#eb6834" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "20px", borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Placement charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Placements by Company</h3>
              {companyStats.length === 0 ? (
                <ChartEmptyState message="No students placed yet. Click “+ Add Placement” below to log the first one." />
              ) : (
                <ApexChart
                  type="bar"
                  height={220}
                  series={[{ name: "Students placed", data: companyStats.slice(0, 8).map(c => c.count) }]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                    colors: companyStats.slice(0, 8).map(c => colorForKey(c.company)),
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%", distributed: true } },
                    dataLabels: { enabled: true, style: { colors: ["#0F1512"], fontSize: "12px", fontWeight: 600 }, offsetX: 6, background: { enabled: false } },
                    xaxis: {
                      categories: companyStats.slice(0, 8).map(c => c.company),
                      labels: { style: { fontSize: "12px" } },
                      axisBorder: { color: "#C3C2B7" },
                    },
                    yaxis: { labels: { style: { fontSize: "12px" } } },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} student${v === 1 ? "" : "s"}` } },
                  }}
                />
              )}
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Placement Trend</h3>
              {placementTrend.length === 0 ? (
                <ChartEmptyState message="Trend appears once placements are recorded." />
              ) : (
                <ApexChart
                  type="line"
                  height={220}
                  series={[{ name: "Placements", data: placementTrend.map(t => t.count) }]}
                  options={{
                    ...BASE_CHART_OPTIONS,
                    chart: { ...BASE_CHART_OPTIONS.chart, type: "line" },
                    colors: [CHART_COLOR],
                    stroke: { curve: "smooth", width: 2 },
                    markers: { size: 4, colors: [CHART_COLOR], strokeWidth: 0 },
                    xaxis: {
                      categories: placementTrend.map(t => t.month),
                      labels: { style: { fontSize: "12px" } },
                      axisBorder: { color: "#C3C2B7" },
                    },
                    yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true, min: 0 },
                    tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} student${v === 1 ? "" : "s"}` } },
                  }}
                />
              )}
            </div>
          </div>

          <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Applications per Drive</h3>
            {driveApplications.length === 0 ? (
              <ChartEmptyState message="No students have applied to a drive yet. Post a drive below to start receiving applications." />
            ) : (
              <ApexChart
                type="bar"
                height={220}
                series={[{ name: "Applications", data: driveApplications.map(d => d.applicants) }]}
                options={{
                  ...BASE_CHART_OPTIONS,
                  chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                  colors: driveApplications.map(d => colorForKey(d.name)),
                  plotOptions: { bar: { columnWidth: "40%", borderRadius: 4, distributed: true } },
                  dataLabels: { enabled: true, style: { colors: ["#0F1512"], fontSize: "12px", fontWeight: 600 }, offsetY: -20, background: { enabled: false } },
                  xaxis: {
                    categories: driveApplications.map(d => d.name),
                    labels: { style: { fontSize: "12px" } },
                    axisBorder: { color: "#C3C2B7" },
                  },
                  yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true, min: 0 },
                  tooltip: { ...BASE_CHART_OPTIONS.tooltip, y: { formatter: (v: number) => `${v} application${v === 1 ? "" : "s"}` } },
                }}
              />
            )}
          </div>

          {/* Companies table */}
          <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Companies</h3>
              <button className="btn btn-p" onClick={() => setShowAddPlacement(true)}>+ Add Placement</button>
            </div>
            {placementMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{placementMsg}</div>}
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                  <th style={{ padding: "12px 8px" }}>Company</th>
                  <th style={{ padding: "12px 8px" }}>Students Placed</th>
                  <th style={{ padding: "12px 8px" }}>Avg. Salary (LPA)</th>
                </tr>
              </thead>
              <tbody>
                {companyStats.map(c => (
                  <tr key={c.company} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CompanyLogo name={c.company} />
                        {c.company}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px" }}>{c.count}</td>
                    <td style={{ padding: "12px 8px" }}>{c.avgSalary.toFixed(1)}</td>
                  </tr>
                ))}
                {companyStats.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No companies yet — placements you add will appear here.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Platform KPIs (secondary) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
            {[
              { label: "Total Users", value: stats.totalUsers, color: "#4f46e5" },
              { label: "Students", value: stats.totalStudents, color: "#0891b2" },
              { label: "Faculty", value: stats.totalFaculty, color: "#7c3aed" },
              { label: "Assessments", value: stats.totalAssessments, color: "#059669" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "20px", borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Placements (standalone) */}
      {activeScreen === "placements" && (
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Recent Placements</h3>
            <button className="btn btn-p" onClick={() => setShowAddPlacement(true)}>+ Add Placement</button>
          </div>
          {placementMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{placementMsg}</div>}
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Student</th>
                <th style={{ padding: "12px 8px" }}>Company</th>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Salary (LPA)</th>
                <th style={{ padding: "12px 8px" }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {[...placements]
                .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
                .map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>{studentsById.get(p.student_id)?.name || `Student #${p.student_id}`}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CompanyLogo name={p.company_name} size={22} />
                        {p.company_name}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px" }}>{p.role}</td>
                    <td style={{ padding: "12px 8px" }}>{p.salary_lpa}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ padding: "4px 10px", background: p.verification_status === "verified" ? "#e6f4ea" : "#fef3c7", color: p.verification_status === "verified" ? "#1e8e3e" : "#b45309", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{p.verification_status}</span>
                    </td>
                  </tr>
                ))}
              {placements.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No students placed yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Placement Drives (standalone) */}
      {activeScreen === "drives" && (
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Placement Drives</h3>
            <button className="btn btn-p" onClick={() => setShowPostDrive(true)}>+ Post Drive</button>
          </div>
          {driveMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{driveMsg}</div>}
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Title</th>
                <th style={{ padding: "12px 8px" }}>Company</th>
                <th style={{ padding: "12px 8px" }}>Applicants</th>
                <th style={{ padding: "12px 8px" }}>Deadline</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {drives.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{d.title}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CompanyLogo name={d.company_name} size={22} />
                      {d.company_name}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{d.applicant_count}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{d.application_deadline ? new Date(d.application_deadline).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: d.status === "active" ? "#e6f4ea" : "#f3f4f6", color: d.status === "active" ? "#1e8e3e" : "#6b7280", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{d.status}</span>
                  </td>
                </tr>
              ))}
              {drives.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No students have applied for a drive — none have been posted yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manage Users (standalone) */}
      {activeScreen === "users" && (
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Manage Users</h3>
            <button className="btn btn-p" onClick={() => setShowCreateUser(true)}>+ Add User</button>
          </div>
          {createMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{createMsg}</div>}
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Name</th>
                <th style={{ padding: "12px 8px" }}>Email</th>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{u.email}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: u.role === "faculty" ? "var(--purple-l, #ede9fe)" : "var(--accent-l)", color: u.role === "faculty" ? "var(--purple, #7c3aed)" : "var(--accent)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: u.status === "approved" ? "#e6f4ea" : u.status === "pending" ? "#fef3c7" : "#fee2e2", color: u.status === "approved" ? "#1e8e3e" : u.status === "pending" ? "#b45309" : "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.status}</span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessments Section */}
      {(activeScreen === "dash" || activeScreen === "assessments") && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Manage Assessments</h3>
            <button className="btn btn-p" onClick={() => setShowCreateAssessment(true)}>+ Create Assessment</button>
          </div>

          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Title</th>
                <th style={{ padding: "12px 8px" }}>Type</th>
                <th style={{ padding: "12px 8px" }}>Difficulty</th>
                <th style={{ padding: "12px 8px" }}>Duration</th>
                <th style={{ padding: "12px 8px" }}>Marks</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{a.title}</td>
                  <td style={{ padding: "12px 8px", textTransform: "capitalize" }}>{a.assessment_type}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: a.difficulty === "hard" ? "#fee2e2" : a.difficulty === "medium" ? "#fef3c7" : "#e6f4ea", color: a.difficulty === "hard" ? "#dc2626" : a.difficulty === "medium" ? "#b45309" : "#1e8e3e", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{a.difficulty}</span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{a.duration_minutes} min</td>
                  <td style={{ padding: "12px 8px" }}>{a.total_marks}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button onClick={() => handleDeleteAssessment(a.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No assessments created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Name</label>
                <input type="text" className="fi" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Email</label>
                <input type="email" className="fi" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Password</label>
                <input type="text" className="fi" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required placeholder="Initial password" />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Role</label>
                <select className="fi" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Department (Optional)</label>
                <select className="fi" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })}>
                  <option value="">Select</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowCreateUser(false)}>Cancel</button>
                <button type="submit" className="btn btn-p" disabled={loading}>{loading ? "Creating..." : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Create Assessment</h3>
            <form onSubmit={handleCreateAssessment}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Title</label>
                <input type="text" className="fi" value={assessmentForm.title} onChange={e => setAssessmentForm({ ...assessmentForm, title: e.target.value })} required placeholder="e.g. Aptitude Test Set 1" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Type</label>
                  <select className="fi" value={assessmentForm.assessment_type} onChange={e => setAssessmentForm({ ...assessmentForm, assessment_type: e.target.value })}>
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="verbal">Verbal</option>
                    <option value="coding">Coding</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Difficulty</label>
                  <select className="fi" value={assessmentForm.difficulty} onChange={e => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <label className="lbl" style={{ marginBottom: 0 }}>Questions Data (JSON file)</label>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI}
                    style={{ background: "none", border: "none", color: "var(--purple)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  >
                    {isGeneratingAI ? "Generating..." : "✨ Auto-Generate with AI"}
                  </button>
                </div>
                <input type="file" accept=".json" className="fi" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const jsonStr = ev.target?.result as string;
                        JSON.parse(jsonStr); // Validate JSON
                        setAssessmentForm(prev => ({ ...prev, description: jsonStr }));
                      } catch (err) {
                        alert("Invalid JSON format. Please upload a valid JSON file.");
                        e.target.value = "";
                      }
                    };
                    reader.readAsText(file);
                  }
                }} />
                {assessmentForm.description && <div style={{ fontSize: "12px", color: "var(--teal)", marginTop: "4px" }}>✓ JSON loaded successfully</div>}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Target Departments (Optional — leave empty for all)</label>
                <select
                  className="fi"
                  multiple
                  style={{ height: "120px" }}
                  value={assessmentForm.target_departments}
                  onChange={e => setAssessmentForm({ ...assessmentForm, target_departments: Array.from(e.target.selectedOptions, o => o.value) })}
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label className="lbl">Duration (min)</label>
                  <input type="number" className="fi" value={assessmentForm.duration_minutes} onChange={e => setAssessmentForm({ ...assessmentForm, duration_minutes: parseInt(e.target.value) || 30 })} />
                </div>
                <div>
                  <label className="lbl">Total Marks</label>
                  <input type="number" className="fi" value={assessmentForm.total_marks} onChange={e => setAssessmentForm({ ...assessmentForm, total_marks: parseInt(e.target.value) || 100 })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowCreateAssessment(false)}>Cancel</button>
                <button type="submit" className="btn btn-p">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Placement Modal */}
      {showAddPlacement && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Add Placement</h3>
            <form onSubmit={handleCreatePlacement}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Student</label>
                <select className="fi" value={placementForm.student_id} onChange={e => setPlacementForm({ ...placementForm, student_id: e.target.value })} required>
                  <option value="">Select a student</option>
                  {users.filter(u => u.role === "student").map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Company</label>
                <input type="text" className="fi" value={placementForm.company_name} onChange={e => setPlacementForm({ ...placementForm, company_name: e.target.value })} required placeholder="e.g. TCS" />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Role</label>
                <input type="text" className="fi" value={placementForm.role} onChange={e => setPlacementForm({ ...placementForm, role: e.target.value })} required placeholder="e.g. Software Engineer" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Salary (LPA)</label>
                  <input type="number" step="0.1" className="fi" value={placementForm.salary_lpa} onChange={e => setPlacementForm({ ...placementForm, salary_lpa: e.target.value })} required placeholder="e.g. 6.5" />
                </div>
                <div>
                  <label className="lbl">Work Type</label>
                  <select className="fi" value={placementForm.work_type} onChange={e => setPlacementForm({ ...placementForm, work_type: e.target.value })}>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Location (Optional)</label>
                <input type="text" className="fi" value={placementForm.location} onChange={e => setPlacementForm({ ...placementForm, location: e.target.value })} placeholder="e.g. Bengaluru" />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowAddPlacement(false)}>Cancel</button>
                <button type="submit" className="btn btn-p">Add Placement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Drive Modal */}
      {showPostDrive && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>Post Placement Drive</h3>
            <form onSubmit={handleCreateDrive}>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Title</label>
                <input type="text" className="fi" value={driveForm.title} onChange={e => setDriveForm({ ...driveForm, title: e.target.value })} required placeholder="e.g. Campus Drive - SDE Roles" />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Company</label>
                <input type="text" className="fi" value={driveForm.company_name} onChange={e => setDriveForm({ ...driveForm, company_name: e.target.value })} required placeholder="e.g. Infosys" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Job Type</label>
                  <select className="fi" value={driveForm.job_type} onChange={e => setDriveForm({ ...driveForm, job_type: e.target.value })}>
                    <option value="full_time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Location</label>
                  <input type="text" className="fi" value={driveForm.location} onChange={e => setDriveForm({ ...driveForm, location: e.target.value })} placeholder="e.g. Chennai" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Min Salary (LPA)</label>
                  <input type="number" step="0.1" className="fi" value={driveForm.salary_min_lpa} onChange={e => setDriveForm({ ...driveForm, salary_min_lpa: e.target.value })} placeholder="e.g. 4" />
                </div>
                <div>
                  <label className="lbl">Max Salary (LPA)</label>
                  <input type="number" step="0.1" className="fi" value={driveForm.salary_max_lpa} onChange={e => setDriveForm({ ...driveForm, salary_max_lpa: e.target.value })} placeholder="e.g. 8" />
                </div>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Application Deadline (Optional)</label>
                <input type="date" className="fi" value={driveForm.application_deadline} onChange={e => setDriveForm({ ...driveForm, application_deadline: e.target.value })} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Eligible Departments (Optional — leave empty for all)</label>
                <select
                  className="fi"
                  multiple
                  style={{ height: "120px" }}
                  value={driveForm.eligible_departments}
                  onChange={e => setDriveForm({ ...driveForm, eligible_departments: Array.from(e.target.selectedOptions, o => o.value) })}
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setShowPostDrive(false)}>Cancel</button>
                <button type="submit" className="btn btn-p">Post Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
