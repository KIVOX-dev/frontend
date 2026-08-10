"use client";

// Types, constants, and small presentational helpers shared between
// CollegeAdminDashboard.tsx and PlacementDashboard.tsx — split out purely to
// shrink CollegeAdminDashboard.tsx (2,181 lines / 57 useState calls before
// this pass, see PROJECT_AUDIT_REPORT.md P2-29). No behavior changes: this
// is the same code that used to live at the top of CollegeAdminDashboard.tsx,
// moved verbatim.

import { useState } from "react";
import Image from "next/image";
import type { ApexOptions } from "apexcharts";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  roll_number?: string;
  created_at?: string;
};

export type Assessment = {
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

export type AttemptResult = {
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
  department_name?: string;
};

export type Department = {
  id: string;
  name: string;
  code?: string;
};

// The students collection's own row id — what placements/test-assignments
// actually key on — is distinct from the linked user's id (see student.id
// vs student.user_id in student.model.js). Fetched separately from `users`
// so the Add Placement picker can resolve a chosen user to the right id.
export type StudentRecord = {
  id: string;
  user_id: string;
  department_id?: string;
};

export type InsightAttempt = {
  id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  created_at: string;
};

export type StudentInsights = {
  tests_completed: number;
  avg_accuracy: number;
  interviews_completed: number;
  history: InsightAttempt[];
};

export type Placement = {
  id: string;
  student_id: string;
  company_name: string;
  role: string;
  salary_lpa: number;
  work_type: string;
  mode: string;
  location?: string;
  status: string;
  verification_status: "pending" | "verified" | "rejected";
  proof_url?: string;
  created_at?: string;
};

export type Drive = {
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

// GET /users and GET /tests are backed by node-api's BaseService.list(),
// which hard-caps `limit` at 100 server-side regardless of what's
// requested — there is no larger page size or "everything" option without
// backend pagination work, out of scope for this pass. Requesting exactly
// that ceiling (rather than omitting `limit`, which silently falls back to
// a default of 20) is the most complete list available today; formatCount
// at least signals when a count has likely been clipped there, instead of
// presenting a truncated fetch as if it were an exact total.
export const LIST_FETCH_CAP = 100;

export function formatCount(count: number): string {
  return count >= LIST_FETCH_CAP ? `${LIST_FETCH_CAP}+` : String(count);
}

export type PlacementApplication = {
  id: string;
  placement_id: string;
  student_id: string;
  status: "applied" | "shortlisted" | "interview" | "selected" | "rejected" | "withdrawn";
  round?: number;
  created_at?: string;
};

// Single accent hue for the trend line — it's genuinely one series over time,
// so sequential/single-hue is the correct color job there (not a simplification).
export const CHART_COLOR = "#0145F2";

// Categorical palette for the Company/Drive bar charts, where each bar IS a
// distinct named entity — identity is the job, so per-bar color is correct
// there, unlike the single-series trend line above. Deeper/richer "corporate"
// tones rather than the bright default — order and hexes re-validated for this
// app (node scripts/validate_palette.js in the dataviz skill, --mode light):
// lightness band, chroma floor, contrast all PASS; one adjacent CVD pair
// (olive↔berry) sits in the legal 6–8 WARN band, which requires direct labels
// as the secondary encoding — already on via dataLabels below.
export const CATEGORICAL = ["#1f5c8f", "#b8632f", "#0d8c76", "#b98a2e", "#a13d5c", "#6b7a2e", "#6a4a94", "#a83a30"];

export function colorForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORICAL[hash % CATEGORICAL.length];
}

// Shared look for every chart on this dashboard — thin bars/lines, recessive
// grid, hover tooltip. Merge chart-specific bits (xaxis categories, chart.type,
// colors) into this per instance rather than duplicating the whole spec.
export const BASE_CHART_OPTIONS: ApexOptions = {
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

export function CompanyLogo({ name, size = 28 }: { name: string; size?: number }) {
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

export function monthKey(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "14px", textAlign: "center", padding: "0 24px" }}>
      {message}
    </div>
  );
}

// A failed fetch is never allowed to render identically to "the list is
// genuinely empty" (see FULL_STACK_AUDIT_REPORT.md FE-001) — this is the
// distinct visual/semantic state a screen shows instead once a loader's
// catch block records an error message. `onRetry` re-runs just that one
// loader, not a full-page reload.
export function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      style={{ padding: "24px", textAlign: "center", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px" }}
    >
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#B91C1C", marginBottom: "4px" }}>Unable to load this data.</p>
      <p style={{ fontSize: "13px", color: "#991B1B", marginBottom: onRetry ? "12px" : 0 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn"
          style={{ borderColor: "#FCA5A5", color: "#B91C1C", background: "#fff" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Same failed-vs-empty distinction as {@link SectionError}, sized to sit
 * inside a chart's plot area instead of a full table section. */
export function ChartErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "0 24px", textAlign: "center" }}>
      <span style={{ color: "#B91C1C", fontSize: "14px", fontWeight: 600 }}>Unable to load this data.</span>
      <span style={{ color: "#991B1B", fontSize: "13px" }}>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn" style={{ borderColor: "#FCA5A5", color: "#B91C1C", background: "#fff", fontSize: "13px" }}>
          Try again
        </button>
      )}
    </div>
  );
}
