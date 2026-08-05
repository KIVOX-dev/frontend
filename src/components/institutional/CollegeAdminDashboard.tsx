"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { LayoutList, LayoutGrid, FileSpreadsheet, FileDown } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { extractErrorMessage as apiErrorMessage } from "@/lib/errors";
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
  roll_number?: string;
  created_at?: string;
};

type Assessment = {
  id: string;
  title: string;
  description?: string;
  status: string;
  difficulty: string;
  duration_minutes: number;
  total_marks: number;
  created_at: string;
  // Set only on the 4 open practice-bank tests (see
  // scripts/seedPracticeTests.js) — null/absent on a regular test this
  // dashboard creates, which is what an "Assign" action targets.
  category?: string | null;
  // Which question-bank category this test auto-draws random questions
  // from, and how many — set on every admin-authored test going forward.
  source_category?: string | null;
  question_count?: number | null;
  start_at?: string | null;
  end_at?: string | null;
};

type AttemptResult = {
  id: string;
  test_id: string;
  test_title: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  completed_at?: string;
};

type Department = {
  id: string;
  name: string;
  code?: string;
};

// The students collection's own row id — what placements/test-assignments
// actually key on — is distinct from the linked user's id (see student.id
// vs student.user_id in student.model.js). Fetched separately from `users`
// so the Add Placement picker can resolve a chosen user to the right id.
type StudentRecord = {
  id: string;
  user_id: string;
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
const CHART_COLOR = "#0145F2";

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
    <Image
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
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userDeptFilter, setUserDeptFilter] = useState("");
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
  const [driveDeptSearch, setDriveDeptSearch] = useState("");
  const [driveMsg, setDriveMsg] = useState("");
  const [postingDrive, setPostingDrive] = useState(false);

  // Assessment form — questions are auto-drawn from the real question bank
  // (source_category + question_count) at assign time, never manually
  // uploaded, so there's no JSON file / AI-generate step anymore.
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: "", description: "", source_category: "quantitative", question_count: 20,
    difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40,
    status: "active", start_at: "", end_at: "", department_id: "", batch_year: String(new Date().getFullYear()),
  });

  // Assign-test form — separate from the create form: assigning a test to a
  // department + batch year is a distinct action from authoring one.
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assigningTest, setAssigningTest] = useState<Assessment | null>(null);
  const [assignForm, setAssignForm] = useState<{ department_ids: string[]; batch_year: number }>({ department_ids: [], batch_year: new Date().getFullYear() });
  const [assignDeptSearch, setAssignDeptSearch] = useState("");
  const [assignResult, setAssignResult] = useState<{ summary: string; failures: { department: string; reason: string }[] } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Results panel — institution-wide student attempts across every
  // assessment (institution_admin's "View student attempts" / "View results
  // and analytics" permission). Toggled inline in place of the assessments
  // table, rather than per-test in a modal, so one button surfaces results
  // across the whole catalog at once.
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsView, setResultsView] = useState<"table" | "cards">("table");
  const [resultsTestFilter, setResultsTestFilter] = useState("");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const resultsContentRef = useRef<HTMLDivElement>(null);

  // Department creation — the departments collection starts empty for every
  // institution; there was previously no UI anywhere that could populate it,
  // which is what left the Assign dropdown above with nothing to select.
  const [newDeptForm, setNewDeptForm] = useState({ name: "", code: "", duration_years: "3" });
  const [deptMsg, setDeptMsg] = useState("");
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  const fetchAllResults = async () => {
    setResultsLoading(true);
    try {
      const res = await api.get<AttemptResult[]>("/tests/college/results");
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleToggleResults = () => {
    const next = !showResultsPanel;
    setShowResultsPanel(next);
    if (next) {
      setResultsView("table");
      setResultsTestFilter("");
      fetchAllResults();
    }
  };

  const resultTestOptions = useMemo(
    () => Array.from(new Set(results.map((r) => r.test_title))).sort((a, b) => a.localeCompare(b)),
    [results]
  );
  const filteredResults = useMemo(
    () => (resultsTestFilter ? results.filter((r) => r.test_title === resultsTestFilter) : results),
    [results, resultsTestFilter]
  );

  const handleExportExcel = async () => {
    if (filteredResults.length === 0) return;
    setIsExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const rows = filteredResults.map((r) => ({
        Test: r.test_title,
        "Roll No": r.roll_number,
        Student: r.student_name,
        Score: r.score,
        "Max Score": r.max_score,
        Percentage: `${r.percentage}%`,
        Result: r.passed ? "Passed" : "Failed",
        Completed: r.completed_at ? new Date(r.completed_at).toLocaleString() : "—",
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Results");
      XLSX.writeFile(workbook, "assessment-results.xlsx");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel file");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (filteredResults.length === 0 || !resultsContentRef.current) return;
    setIsExporting("pdf");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 12,
          filename: "assessment-results.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        })
        .from(resultsContentRef.current)
        .save();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(null);
    }
  };


  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      // The API returns full_name/roll_number (roll_number only resolved for
      // student rows) — mapped to this component's User shape here so every
      // other reader of `users` can just use u.name/u.roll_number.
      const mapped: User[] = res.data
        .filter((u: any) => u.role !== "college_admin" && u.role !== "institution_admin")
        .map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.status,
          department: u.department,
          roll_number: u.roll_number,
          created_at: u.created_at,
        }));
      setUsers(mapped);
      const students = mapped.filter(u => u.role === "student").length;
      const faculty = mapped.filter(u => u.role === "faculty").length;
      setStats(prev => ({ ...prev, totalUsers: res.data.length, totalStudents: students, totalFaculty: faculty }));
    } catch (err) { console.error(err); }
  };

  const fetchStudentRecords = async () => {
    try {
      const res = await api.get("/students?limit=1000");
      setStudentRecords(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/tests");
      setAssessments(res.data);
      setStats(prev => ({ ...prev, totalAssessments: res.data.length }));
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data);
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
      const res = await api.get("/placements/drives");
      setDrives(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
    fetchStudentRecords();
    fetchAssessments();
    fetchPlacements();
    fetchDrives();
    fetchDepartments();
  }, []);

  const studentsById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const studentRecordIdByUserId = useMemo(
    () => new Map(studentRecords.map(s => [String(s.user_id), s.id])),
    [studentRecords]
  );

  const userRoleOptions = useMemo(
    () => Array.from(new Set(users.map(u => u.role))).sort((a, b) => a.localeCompare(b)),
    [users]
  );
  const userDeptOptions = useMemo(
    () => Array.from(new Set(users.map(u => u.department).filter((d): d is string => Boolean(d)))).sort((a, b) => a.localeCompare(b)),
    [users]
  );
  const filteredUsers = useMemo(
    () => users.filter(u =>
      (!userRoleFilter || u.role === userRoleFilter) &&
      (!userDeptFilter || u.department === userDeptFilter)
    ),
    [users, userRoleFilter, userDeptFilter]
  );

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
        // student_id is a UUID (the students collection's own row id) —
        // never a number, so it must be sent as-is, not through parseInt().
        student_id: placementForm.student_id,
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
    } catch (err: unknown) {
      setPlacementMsg(apiErrorMessage(err, "Failed to add placement"));
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveMsg("");

    if (driveForm.salary_min_lpa && driveForm.salary_max_lpa && parseFloat(driveForm.salary_min_lpa) > parseFloat(driveForm.salary_max_lpa)) {
      setDriveMsg("Min salary can't be greater than max salary.");
      return;
    }

    setPostingDrive(true);
    try {
      await api.post("/placements", {
        title: driveForm.title,
        company_name: driveForm.company_name,
        location: driveForm.location || undefined,
        job_type: driveForm.job_type,
        salary_min_lpa: driveForm.salary_min_lpa ? parseFloat(driveForm.salary_min_lpa) : undefined,
        salary_max_lpa: driveForm.salary_max_lpa ? parseFloat(driveForm.salary_max_lpa) : undefined,
        application_deadline: driveForm.application_deadline || undefined,
        eligible_departments: driveForm.eligible_departments.length ? driveForm.eligible_departments : undefined,
        status: "open",
      });
      setShowPostDrive(false);
      setDriveForm({ title: "", company_name: "", location: "", job_type: "full_time", salary_min_lpa: "", salary_max_lpa: "", application_deadline: "", eligible_departments: [] });
      setDriveDeptSearch("");
      fetchDrives();
    } catch (err: unknown) {
      setDriveMsg(apiErrorMessage(err, "Failed to post drive"));
    } finally {
      setPostingDrive(false);
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
    } catch (err: unknown) {
      setCreateMsg(apiErrorMessage(err, "Failed to create user"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch { toast.error("Failed to delete"); }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/tests", {
        // institution_id is required by the Joi schema but is always
        // overwritten server-side by scopeInstitution to the caller's own
        // institution (see handleCreateDepartment) — this placeholder is
        // never actually trusted. Omitting the key entirely, as this used
        // to, left it missing and failed validation before the request
        // ever reached the service that would have derived it.
        institution_id: currentUser?.institution_id || "",
        title: assessmentForm.title,
        description: assessmentForm.description,
        test_type: "mcq",
        // Auto-sourced from the real question bank at assign time (see
        // testAssignment.service.js#create) — no manual upload anymore.
        source_category: assessmentForm.source_category,
        question_count: assessmentForm.question_count,
        difficulty: assessmentForm.difficulty,
        duration_minutes: assessmentForm.duration_minutes,
        total_marks: assessmentForm.total_marks,
        pass_percentage: assessmentForm.pass_percentage,
        status: assessmentForm.status,
        start_at: assessmentForm.start_at || null,
        end_at: assessmentForm.end_at || null,
      });

      let assignNote = "";
      let assignFailed = false;
      if (assessmentForm.department_id) {
        try {
          const assignRes = await api.post("/test-assignments", {
            test_id: res.data.id,
            department_id: assessmentForm.department_id,
            batch_year: parseInt(assessmentForm.batch_year, 10) || new Date().getFullYear(),
          });
          const { assigned_count, matched_students } = assignRes.data as { assigned_count: number; matched_students: number };
          assignNote = `Assigned to ${assigned_count} of ${matched_students} matching student(s).`;
        } catch (assignErr: any) {
          assignFailed = true;
          assignNote = `Created, but assigning it failed: ${apiErrorMessage(assignErr, "unknown error")}`;
        }
      }

      setShowCreateAssessment(false);
      setAssessmentForm({
        title: "", description: "", source_category: "quantitative", question_count: 20,
        difficulty: "medium", duration_minutes: 30, total_marks: 100, pass_percentage: 40,
        status: "active", start_at: "", end_at: "", department_id: "", batch_year: String(new Date().getFullYear()),
      });
      fetchAssessments();
      if (assignNote) {
        if (assignFailed) toast.warning("Assessment created", assignNote);
        else toast.success("Assessment created", assignNote);
      } else {
        toast.success("Assessment created");
      }
    } catch (err: any) {
      toast.error(err, "Failed to create assessment");
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Delete this assessment?")) return;
    try {
      await api.delete(`/tests/${id}`);
      fetchAssessments();
      toast.success("Assessment deleted.");
    } catch { toast.error("Failed to delete"); }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTest) return;
    if (assignForm.department_ids.length === 0) {
      setAssignResult({ summary: "Select at least one department.", failures: [] });
      return;
    }
    setAssignResult(null);
    setIsAssigning(true);

    // The API assigns to one department per call — loop sequentially (rather
    // than Promise.all) so a slow/large department doesn't pile requests up
    // against the same institution's student collection at once.
    let totalAssigned = 0;
    let totalMatched = 0;
    const failures: { department: string; reason: string }[] = [];
    for (const deptId of assignForm.department_ids) {
      try {
        const res = await api.post("/test-assignments", {
          test_id: assigningTest.id,
          department_id: deptId,
          batch_year: assignForm.batch_year,
        });
        const { assigned_count, matched_students } = res.data as { assigned_count: number; matched_students: number };
        totalAssigned += assigned_count;
        totalMatched += matched_students;
      } catch (err: unknown) {
        const deptName = departments.find(d => d.id === deptId)?.name || deptId;
        failures.push({ department: deptName, reason: apiErrorMessage(err, "failed") });
      }
    }

    setIsAssigning(false);
    const deptCount = assignForm.department_ids.length - failures.length;
    setAssignResult({
      summary: deptCount > 0
        ? `Assigned to ${totalAssigned} of ${totalMatched} matching student(s) across ${deptCount} department(s).`
        : "",
      failures,
    });
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.name.trim() || !newDeptForm.code.trim()) return;
    setDeptMsg("");
    setIsCreatingDept(true);
    try {
      // institution_id is required by the Joi schema but is always
      // overwritten server-side by scopeInstitution to the caller's own
      // institution — this placeholder is never actually trusted.
      await api.post("/departments", {
        institution_id: currentUser?.institution_id || "",
        name: newDeptForm.name.trim(),
        code: newDeptForm.code.trim(),
        duration_years: newDeptForm.duration_years ? Number(newDeptForm.duration_years) : undefined,
      });
      setNewDeptForm({ name: "", code: "", duration_years: "3" });
      fetchDepartments();
    } catch (err: any) {
      setDeptMsg(apiErrorMessage(err, "Failed to add department"));
    } finally {
      setIsCreatingDept(false);
    }
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
            <button className="btn btn-p" onClick={() => { setDriveMsg(""); setDriveDeptSearch(""); setShowPostDrive(true); }}>+ Post Drive</button>
          </div>
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
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Manage Users</h3>
            <button className="btn btn-p" onClick={() => setShowCreateUser(true)}>+ Add User</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <select className="fi" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} style={{ maxWidth: "200px" }}>
              <option value="">All roles ({users.length})</option>
              {userRoleOptions.map(role => (
                <option key={role} value={role}>
                  {role.replace("_", " ")} ({users.filter(u => u.role === role).length})
                </option>
              ))}
            </select>
            <select className="fi" value={userDeptFilter} onChange={e => setUserDeptFilter(e.target.value)} style={{ maxWidth: "240px" }}>
              <option value="">All departments</option>
              {userDeptOptions.map(dept => (
                <option key={dept} value={dept}>
                  {dept} ({users.filter(u => u.department === dept).length})
                </option>
              ))}
            </select>
            {(userRoleFilter || userDeptFilter) && (
              <button
                type="button"
                onClick={() => { setUserRoleFilter(""); setUserDeptFilter(""); }}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
              >
                Clear filters
              </button>
            )}
          </div>
          {createMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{createMsg}</div>}
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Name</th>
                <th style={{ padding: "12px 8px" }}>Roll No</th>
                <th style={{ padding: "12px 8px" }}>Email</th>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Department</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{u.role === "student" ? (u.roll_number || "—") : "—"}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{u.email}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: u.role === "faculty" ? "var(--purple-l, #ede9fe)" : "var(--accent-l)", color: u.role === "faculty" ? "var(--purple, #7c3aed)" : "var(--accent)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{u.department || "—"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ padding: "4px 10px", background: u.status === "approved" ? "#e6f4ea" : u.status === "pending" ? "#fef3c7" : "#fee2e2", color: u.status === "approved" ? "#1e8e3e" : u.status === "pending" ? "#b45309" : "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{u.status}</span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>{users.length === 0 ? "No users found." : "No users match the selected filters."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Departments — feeds both the Assign dropdown below and the
          department picker students/faculty use elsewhere. */}
      {activeScreen === "assessments" && (
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Departments</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Required before you can assign a test by department — add each department once.</p>
          <form onSubmit={handleCreateDepartment} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{ flex: "2 1 200px" }}>
              <label className="lbl">Name</label>
              <input type="text" className="fi" placeholder="e.g. Computer Science" value={newDeptForm.name} onChange={e => setNewDeptForm({ ...newDeptForm, name: e.target.value })} required />
            </div>
            <div style={{ flex: "1 1 100px" }}>
              <label className="lbl">Code</label>
              <input type="text" className="fi" placeholder="e.g. CSE" value={newDeptForm.code} onChange={e => setNewDeptForm({ ...newDeptForm, code: e.target.value })} required />
            </div>
            <div style={{ flex: "1 1 130px" }}>
              <label className="lbl">Duration (years)</label>
              <input type="number" min="1" max="10" className="fi" placeholder="3" value={newDeptForm.duration_years} onChange={e => setNewDeptForm({ ...newDeptForm, duration_years: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-p" disabled={isCreatingDept}>{isCreatingDept ? "Adding..." : "+ Add Department"}</button>
          </form>
          {deptMsg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>{deptMsg}</div>}
          {departments.length === 0 ? (
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>No departments added yet.</span>
          ) : (
            <select className="fi" defaultValue="" style={{ maxWidth: "320px" }}>
              <option value="" disabled>{departments.length} department{departments.length === 1 ? "" : "s"} added</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ""}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Assessments Section */}
      {(activeScreen === "dash" || activeScreen === "assessments") && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{showResultsPanel ? "Results" : "Manage Assessments"}</h3>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn btn-p" onClick={() => setShowCreateAssessment(true)}>+ Create Assessment</button>
              <button
                type="button"
                className="btn"
                onClick={handleToggleResults}
                aria-pressed={showResultsPanel}
                style={showResultsPanel ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined}
              >
                {showResultsPanel ? "← Assessments" : "Results"}
              </button>
            </div>
          </div>

          {!showResultsPanel ? (
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                  <th style={{ padding: "12px 8px" }}>Title</th>
                  <th style={{ padding: "12px 8px" }}>Source</th>
                  <th style={{ padding: "12px 8px" }}>Difficulty</th>
                  <th style={{ padding: "12px 8px" }}>Duration</th>
                  <th style={{ padding: "12px 8px" }}>Questions</th>
                  <th style={{ padding: "12px 8px" }}>Marks</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                      {a.title}
                      {a.category && (
                        <span style={{ marginLeft: "8px", padding: "2px 8px", background: "#DCFCE7", color: "#15803D", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                          Practice
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 8px", textTransform: "capitalize" }}>{(a.source_category || a.category || "—").replace("_", " ")}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ padding: "4px 10px", background: a.difficulty === "hard" ? "#fee2e2" : a.difficulty === "medium" ? "#fef3c7" : "#e6f4ea", color: a.difficulty === "hard" ? "#dc2626" : a.difficulty === "medium" ? "#b45309" : "#1e8e3e", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{a.difficulty}</span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>{a.duration_minutes} min</td>
                    <td style={{ padding: "12px 8px" }}>{a.question_count ?? "—"}</td>
                    <td style={{ padding: "12px 8px" }}>{a.total_marks}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      {!a.category && (
                        <button
                          onClick={() => { setAssigningTest(a); setAssignResult(null); setAssignDeptSearch(""); setAssignForm({ department_ids: [], batch_year: new Date().getFullYear() }); }}
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginRight: "16px" }}
                        >
                          Assign
                        </button>
                      )}
                      <button onClick={() => handleDeleteAssessment(a.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No assessments created yet.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <div>
              {results.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  {/* Filter by test */}
                  <select
                    className="fi"
                    value={resultsTestFilter}
                    onChange={(e) => setResultsTestFilter(e.target.value)}
                    style={{ maxWidth: "260px" }}
                  >
                    <option value="">All tests ({results.length})</option>
                    {resultTestOptions.map((title) => (
                      <option key={title} value={title}>
                        {title} ({results.filter((r) => r.test_title === title).length})
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                  {/* Table / Cards toggle */}
                  <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", padding: "2px" }}>
                    <button
                      type="button"
                      onClick={() => setResultsView("table")}
                      aria-pressed={resultsView === "table"}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "6px",
                        fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
                        background: resultsView === "table" ? "var(--ink)" : "transparent",
                        color: resultsView === "table" ? "#fff" : "var(--muted)",
                      }}
                    >
                      <LayoutList size={14} /> Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultsView("cards")}
                      aria-pressed={resultsView === "cards"}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "6px",
                        fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
                        background: resultsView === "cards" ? "var(--ink)" : "transparent",
                        color: resultsView === "cards" ? "#fff" : "var(--muted)",
                      }}
                    >
                      <LayoutGrid size={14} /> Cards
                    </button>
                  </div>

                  {/* Export buttons */}
                  <button type="button" className="btn" onClick={handleExportExcel} disabled={isExporting !== null}>
                    <FileSpreadsheet size={14} /> {isExporting === "excel" ? "Exporting…" : "Excel"}
                  </button>
                  <button type="button" className="btn btn-p" onClick={handleExportPdf} disabled={isExporting !== null}>
                    <FileDown size={14} /> {isExporting === "pdf" ? "Exporting…" : "PDF"}
                  </button>
                  </div>
                </div>
              )}

              {resultsLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>Loading...</div>
              ) : results.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>No attempts yet.</div>
              ) : filteredResults.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>No attempts for this test.</div>
              ) : (
                <div ref={resultsContentRef}>
                  {resultsView === "table" ? (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                          <th style={{ padding: "8px" }}>Roll No</th>
                          <th style={{ padding: "8px" }}>Student</th>
                          <th style={{ padding: "8px" }}>Score</th>
                          <th style={{ padding: "8px" }}>%</th>
                          <th style={{ padding: "8px" }}>Result</th>
                          <th style={{ padding: "8px" }}>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map(r => (
                          <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "8px", fontWeight: 500 }}>{r.roll_number}</td>
                            <td style={{ padding: "8px" }}>{r.student_name}</td>
                            <td style={{ padding: "8px" }}>{r.score} / {r.max_score}</td>
                            <td style={{ padding: "8px" }}>{r.percentage}%</td>
                            <td style={{ padding: "8px" }}>
                              <span style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: r.passed ? "#DCFCE7" : "#FEE2E2", color: r.passed ? "#15803D" : "#DC2626" }}>
                                {r.passed ? "Passed" : "Failed"}
                              </span>
                            </td>
                            <td style={{ padding: "8px", fontSize: "13px", color: "var(--muted)" }}>{r.completed_at ? new Date(r.completed_at).toLocaleString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                      {filteredResults.map((r) => (
                        <div key={r.id} className="card-sm" style={{ padding: "16px", borderRadius: "12px" }}>
                          <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{r.student_name}</p>
                          <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{r.test_title}</p>
                          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "10px" }}>
                            {r.score} / {r.max_score} · {r.percentage}%
                          </p>
                          <span style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: r.passed ? "#DCFCE7" : "#FEE2E2", color: r.passed ? "#15803D" : "#DC2626" }}>
                            {r.passed ? "Passed" : "Failed"}
                          </span>
                          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "10px" }}>
                            {r.completed_at ? new Date(r.completed_at).toLocaleString() : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
              <div style={{ marginBottom: "14px" }}>
                <label className="lbl">Description</label>
                <textarea className="fi" rows={2} value={assessmentForm.description} onChange={e => setAssessmentForm({ ...assessmentForm, description: e.target.value })} placeholder="What this assessment covers" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Question Source</label>
                  <select className="fi" value={assessmentForm.source_category} onChange={e => setAssessmentForm({ ...assessmentForm, source_category: e.target.value })}>
                    <option value="quantitative">Quantitative</option>
                    <option value="logical">Logical Reasoning</option>
                    <option value="verbal">Verbal Ability</option>
                    <option value="data_interpretation">Data Interpretation</option>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Number of Questions</label>
                  <input type="number" min={1} max={200} className="fi" value={assessmentForm.question_count} onChange={e => setAssessmentForm({ ...assessmentForm, question_count: parseInt(e.target.value) || 20 })} />
                </div>
                <div>
                  <label className="lbl">Duration (min)</label>
                  <input type="number" className="fi" value={assessmentForm.duration_minutes} onChange={e => setAssessmentForm({ ...assessmentForm, duration_minutes: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Total Marks</label>
                  <input type="number" className="fi" value={assessmentForm.total_marks} onChange={e => setAssessmentForm({ ...assessmentForm, total_marks: parseInt(e.target.value) || 100 })} />
                </div>
                <div>
                  <label className="lbl">Status</label>
                  <select className="fi" value={assessmentForm.status} onChange={e => setAssessmentForm({ ...assessmentForm, status: e.target.value })}>
                    <option value="active">Publish now</option>
                    <option value="draft">Save as draft</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="lbl">Start Date &amp; Time</label>
                  <input type="datetime-local" className="fi" value={assessmentForm.start_at} onChange={e => setAssessmentForm({ ...assessmentForm, start_at: e.target.value })} />
                </div>
                <div>
                  <label className="lbl">End Date &amp; Time</label>
                  <input type="datetime-local" className="fi" value={assessmentForm.end_at} onChange={e => setAssessmentForm({ ...assessmentForm, end_at: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label className="lbl">Department (Optional)</label>
                  <select className="fi" value={assessmentForm.department_id} onChange={e => setAssessmentForm({ ...assessmentForm, department_id: e.target.value })}>
                    <option value="">Assign later / all</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl">Batch Year {assessmentForm.department_id && <span style={{ color: "var(--red)" }}>*</span>}</label>
                  <input type="number" className="fi" value={assessmentForm.batch_year} onChange={e => setAssessmentForm({ ...assessmentForm, batch_year: e.target.value })} disabled={!assessmentForm.department_id} />
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

      {/* Assign Test Modal */}
      {assigningTest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ padding: "32px", width: "100%", maxWidth: "440px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>Assign Test</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>{assigningTest.title}</p>
            <form onSubmit={handleAssignTest}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label className="lbl">Departments</label>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{assignForm.department_ids.length} selected</span>
                </div>
                <input
                  type="text"
                  className="fi"
                  placeholder="Search departments…"
                  value={assignDeptSearch}
                  onChange={e => setAssignDeptSearch(e.target.value)}
                  style={{ marginBottom: "8px" }}
                />
                {(() => {
                  const filteredDepts = departments.filter(d =>
                    d.name.toLowerCase().includes(assignDeptSearch.trim().toLowerCase())
                  );
                  const allFilteredSelected = filteredDepts.length > 0 && filteredDepts.every(d => assignForm.department_ids.includes(d.id));
                  return (
                    <>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setAssignForm({
                            ...assignForm,
                            department_ids: allFilteredSelected
                              ? assignForm.department_ids.filter(id => !filteredDepts.some(d => d.id === id))
                              : Array.from(new Set([...assignForm.department_ids, ...filteredDepts.map(d => d.id)])),
                          })}
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}
                        >
                          {allFilteredSelected ? "Deselect all" : "Select all"}{assignDeptSearch ? " (matching)" : ""}
                        </button>
                        {assignForm.department_ids.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setAssignForm({ ...assignForm, department_ids: [] })}
                            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div style={{ border: "1px solid var(--border)", borderRadius: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {filteredDepts.length === 0 ? (
                          <div style={{ padding: "12px", fontSize: "13px", color: "var(--muted)" }}>
                            {departments.length === 0 ? "No departments found for this institution yet." : "No departments match your search."}
                          </div>
                        ) : (
                          filteredDepts.map(d => (
                            <label
                              key={d.id}
                              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                            >
                              <input
                                type="checkbox"
                                checked={assignForm.department_ids.includes(d.id)}
                                onChange={e => setAssignForm({
                                  ...assignForm,
                                  department_ids: e.target.checked
                                    ? [...assignForm.department_ids, d.id]
                                    : assignForm.department_ids.filter(id => id !== d.id),
                                })}
                              />
                              {d.name}{d.code ? ` (${d.code})` : ""}
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="lbl">Graduation / Batch Year</label>
                <input
                  type="number"
                  className="fi"
                  value={assignForm.batch_year}
                  onChange={e => setAssignForm({ ...assignForm, batch_year: parseInt(e.target.value) || new Date().getFullYear() })}
                  required
                />
              </div>
              {assignResult && (
                <div style={{ marginBottom: "14px" }}>
                  {assignResult.summary && (
                    <div style={{ padding: "10px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px", marginBottom: assignResult.failures.length > 0 ? "8px" : 0 }}>
                      {assignResult.summary}
                    </div>
                  )}
                  {assignResult.failures.length > 0 && (
                    <div style={{ padding: "10px", background: "#FEF2F2", borderRadius: "8px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#DC2626", marginBottom: "6px" }}>
                        Failed ({assignResult.failures.length})
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#DC2626" }}>
                        {assignResult.failures.map((f, i) => (
                          <li key={i} style={{ marginBottom: i === assignResult.failures.length - 1 ? 0 : "4px" }}>
                            <strong>{f.department}</strong> — {f.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setAssigningTest(null)}>Close</button>
                <button type="submit" className="btn btn-p" disabled={isAssigning}>{isAssigning ? "Assigning..." : "Assign"}</button>
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
                  {users.filter(u => u.role === "student").map(s => {
                    // The dropdown must submit the students collection's row
                    // id, not this user's own id — see student_id comment in
                    // handleCreatePlacement. Skip anyone whose student
                    // profile hasn't loaded/resolved rather than submit the
                    // wrong id.
                    const studentRecordId = studentRecordIdByUserId.get(String(s.id));
                    if (!studentRecordId) return null;
                    return (
                      <option key={s.id} value={studentRecordId}>{s.name} ({s.email})</option>
                    );
                  })}
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
            {driveMsg && <div style={{ padding: "10px", marginBottom: "14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>{driveMsg}</div>}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label className="lbl">Eligible Departments (Optional — leave empty for all)</label>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{driveForm.eligible_departments.length} selected</span>
                </div>
                <input
                  type="text"
                  className="fi"
                  placeholder="Search departments…"
                  value={driveDeptSearch}
                  onChange={e => setDriveDeptSearch(e.target.value)}
                  style={{ marginBottom: "8px" }}
                />
                {(() => {
                  const filteredDepts = departmentOptions.filter(d =>
                    d.toLowerCase().includes(driveDeptSearch.trim().toLowerCase())
                  );
                  const allFilteredSelected = filteredDepts.length > 0 && filteredDepts.every(d => driveForm.eligible_departments.includes(d));
                  return (
                    <>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setDriveForm({
                            ...driveForm,
                            eligible_departments: allFilteredSelected
                              ? driveForm.eligible_departments.filter(d => !filteredDepts.includes(d))
                              : Array.from(new Set([...driveForm.eligible_departments, ...filteredDepts])),
                          })}
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}
                        >
                          {allFilteredSelected ? "Deselect all" : "Select all"}{driveDeptSearch ? " (matching)" : ""}
                        </button>
                        {driveForm.eligible_departments.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setDriveForm({ ...driveForm, eligible_departments: [] })}
                            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div style={{ border: "1px solid var(--border)", borderRadius: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {filteredDepts.length === 0 ? (
                          <div style={{ padding: "12px", fontSize: "13px", color: "var(--muted)" }}>No departments match your search.</div>
                        ) : (
                          filteredDepts.map(dept => (
                            <label
                              key={dept}
                              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                            >
                              <input
                                type="checkbox"
                                checked={driveForm.eligible_departments.includes(dept)}
                                onChange={e => setDriveForm({
                                  ...driveForm,
                                  eligible_departments: e.target.checked
                                    ? [...driveForm.eligible_departments, dept]
                                    : driveForm.eligible_departments.filter(d => d !== dept),
                                })}
                              />
                              {dept}
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn" disabled={postingDrive} onClick={() => { setShowPostDrive(false); setDriveMsg(""); }}>Cancel</button>
                <button type="submit" className="btn btn-p" disabled={postingDrive}>{postingDrive ? "Posting..." : "Post Drive"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
