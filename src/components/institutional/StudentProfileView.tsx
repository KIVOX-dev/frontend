"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  type StudentInsights, type InsightCategoryTrend, BASE_CHART_OPTIONS, SectionError, StudentAvatar,
} from "./collegeAdminShared";

// ApexCharts touches `window` at import time — never during SSR.
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CATEGORY_COLORS: Record<string, string> = {
  quantitative: "#2563EB",
  logical: "#16A34A",
  verbal: "#7C3AED",
  data_interpretation: "#D97706",
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const scoreColor = (pct: number) => (pct >= 70 ? "#1e8e3e" : pct >= 40 ? "#f59e0b" : "#dc2626");

function toList(v?: string[] | string | null): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <h4 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>{title}</h4>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "28px", textAlign: "center", background: "var(--bg)", borderRadius: "12px", color: "var(--muted)", fontSize: "14px" }}>
      {children}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{title}</div>
      {children}
    </div>
  );
}

function StatTile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="card" style={{ padding: "18px 20px", background: "var(--bg)", border: "none" }}>
      <div style={{ fontSize: "26px", fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function CategoryTrendCard({ trend }: { trend: InsightCategoryTrend }) {
  const color = CATEGORY_COLORS[trend.category] || "var(--accent)";
  const latest = trend.points[trend.points.length - 1]?.percentage ?? null;
  return (
    <div className="card" style={{ padding: "16px", background: "var(--bg)", border: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{trend.label}</span>
        {latest !== null && <span style={{ fontSize: "13px", fontWeight: 800, color }}>{latest}%</span>}
      </div>
      {trend.points.length < 2 ? (
        <div style={{ height: 32, display: "flex", alignItems: "center", fontSize: "12px", color: "var(--muted)" }}>
          {trend.points.length === 0 ? "No attempts yet" : "One more attempt unlocks a trend"}
        </div>
      ) : (
        <ApexChart
          type="line"
          height={32}
          width="100%"
          series={[{ data: trend.points.map((p) => p.percentage) }]}
          options={{ chart: { sparkline: { enabled: true }, animations: { enabled: false } }, stroke: { curve: "smooth", width: 2 }, colors: [color], tooltip: { enabled: false } }}
        />
      )}
      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
        {trend.points.length} attempt{trend.points.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

type Props = {
  name: string;
  email: string;
  department?: string;
  avatarUrl?: string | null;
  data: StudentInsights | null;
  loading: boolean;
  error?: string | null;
  onBack: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
  backLabel?: string;
};

// Full-page student profile (replaces the old insights modal). Mirrors the
// sections of the printable TalentSnaps report: header + KPIs, aptitude
// charts, skill badges & certificates, AI mock interviews, and test history.
export function StudentProfileView({ name, email, department, avatarUrl, data, loading, error, onBack, onRetry, onDownload, downloading, backLabel = "Back to students" }: Props) {
  const profile = data?.profile;
  const dept = profile?.department || department;
  const interviews = data?.interviews ?? [];
  const badges = data?.badges ?? [];
  const certificates = data?.certificates ?? [];
  const passed = data?.history?.filter((a) => a.passed).length ?? 0;
  const ratedInterviews = interviews.filter((i) => typeof i.overall_rating === "number");
  const avgInterview = ratedInterviews.length
    ? ratedInterviews.reduce((s, i) => s + (i.overall_rating as number), 0) / ratedInterviews.length
    : null;

  const categoryBars = (data?.category_trends ?? []).filter((t) => t.points.length > 0).map((t) => ({
    label: t.label,
    category: t.category,
    avg: Math.round(t.points.reduce((s, p) => s + p.percentage, 0) / t.points.length),
  }));
  const history = data?.history ?? [];

  const details: [string, string][] = [
    ["Email", email],
    ["Roll No.", profile?.roll_number || "—"],
    ["Department", dept || "—"],
    ["Batch", profile?.batch_year ? String(profile.batch_year) : "—"],
    ["CGPA", profile?.cgpa != null ? String(profile.cgpa) : "—"],
    ["Target role", profile?.target_job_role ? profile.target_job_role.replace(/[-_]/g, " ") : "—"],
  ];

  return (
    <div className="screen active" style={{ padding: "clamp(16px, 4vw, 40px)" }}>
      <button
        type="button"
        onClick={onBack}
        className="btn btn-sm"
        style={{ marginBottom: "20px" }}
      >
        ← {backLabel}
      </button>

      <div className="card" style={{ padding: "28px", marginBottom: "28px", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <StudentAvatar name={name} url={avatarUrl} sizePx={84} />
        <div style={{ flex: 1, minWidth: "260px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>{name}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px 24px", fontSize: "13px" }}>
            {details.map(([k, v]) => (
              <div key={k}>
                <span style={{ color: "var(--muted)" }}>{k}: </span>
                <span style={{ color: "var(--text)", fontWeight: 600, textTransform: k === "Target role" ? "capitalize" : undefined }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {onDownload && data && (
          <button type="button" onClick={onDownload} disabled={downloading} className="btn btn-p" style={{ padding: "10px 18px", fontSize: "13px", opacity: downloading ? 0.7 : 1 }}>
            {downloading ? "Preparing…" : "Download as PDF"}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading profile…</div>
      ) : error ? (
        <SectionError message={error} onRetry={onRetry} />
      ) : !data ? (
        <Empty>No student profile linked to this account yet.</Empty>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <StatTile value={String(data.tests_completed)} label="Aptitude tests" />
            <StatTile value={`${data.avg_accuracy.toFixed(1)}%`} label="Average accuracy" color="var(--accent)" />
            <StatTile value={String(passed)} label="Tests passed" />
            <StatTile value={profile?.batch_rank ? `${profile.batch_rank} / ${profile.batch_size}` : "—"} label="Batch rank" />
            <StatTile value={String(badges.length)} label="Skill badges" />
            <StatTile value={String(certificates.length)} label="Certificates" />
            <StatTile value={String(data.interviews_completed)} label="AI interviews" />
            <StatTile value={String(data.placements ?? 0)} label="Placements" />
          </div>

          {data.focus_message && (
            <div className="card" style={{ padding: "18px 20px", background: "var(--accent-l, #eff6ff)", border: "1px solid rgba(37, 99, 235, 0.2)", marginBottom: "32px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--accent)", marginBottom: "6px" }}>What To Focus On</div>
              <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{data.focus_message}</p>
            </div>
          )}

          <Section title="Aptitude Performance">
            {history.length === 0 ? (
              <Empty>No assessments completed by this student yet.</Empty>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "16px", marginBottom: "16px" }}>
                  <ChartCard title="Average score by area (0–100)">
                    <ApexChart
                      type="bar"
                      height={260}
                      series={[{ name: "Average", data: categoryBars.map((c) => c.avg) }]}
                      options={{
                        ...BASE_CHART_OPTIONS,
                        chart: { ...BASE_CHART_OPTIONS.chart, type: "bar" },
                        plotOptions: { bar: { distributed: true, borderRadius: 4, columnWidth: "45%" } },
                        colors: categoryBars.map((c) => CATEGORY_COLORS[c.category] || "#2563EB"),
                        xaxis: { categories: categoryBars.map((c) => c.label) },
                        yaxis: { min: 0, max: 100 },
                        dataLabels: { enabled: true, formatter: (v: number) => `${v}%` },
                      }}
                    />
                  </ChartCard>
                  <ChartCard title="Test score over time">
                    <ApexChart
                      type="area"
                      height={260}
                      series={[{ name: "Accuracy", data: history.map((a) => Math.round(a.percentage)) }]}
                      options={{
                        ...BASE_CHART_OPTIONS,
                        chart: { ...BASE_CHART_OPTIONS.chart, type: "area" },
                        stroke: { curve: "smooth", width: 3 },
                        colors: ["#2563EB"],
                        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
                        xaxis: { categories: history.map((a) => shortDate(a.created_at)), labels: { rotate: -30, hideOverlappingLabels: true } },
                        yaxis: { min: 0, max: 100 },
                        markers: { size: 4 },
                      }}
                    />
                  </ChartCard>
                </div>
                <h5 style={{ fontSize: "14px", fontWeight: 700, margin: "24px 0 12px", color: "var(--text)" }}>Growth trends</h5>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {data.category_trends.map((t) => <CategoryTrendCard key={t.category} trend={t} />)}
                </div>
              </>
            )}
          </Section>

          <Section title="Skills Earned Through Video Learning">
            {badges.length === 0 ? (
              <Empty>No skill badges earned yet.</Empty>
            ) : (
              <>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "14px" }}>
                  One badge is awarded per passed lesson in a skill; 5 badges in a skill earn a verifiable certificate.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: "12px" }}>
                  {badges.map((b) => {
                    const pct = Math.min(100, (b.badge_count / 5) * 100);
                    return (
                      <div key={b.skill_name} className="card" style={{ padding: "16px", background: "var(--bg)", border: "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{b.skill_name}</span>
                          <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: b.certificate_issued ? "#e6f4ea" : "#fef3c7", color: b.certificate_issued ? "#1e8e3e" : "#b45309" }}>
                            {b.certificate_issued ? "Certified" : "In progress"}
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: b.certificate_issued ? "#1e8e3e" : "#f59e0b" }} />
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
                          {Math.min(b.badge_count, 5)}/5 lessons passed
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          <Section title="Certificates">
            {certificates.length === 0 ? (
              <Empty>No certificates issued yet.</Empty>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "12px" }}>
                {certificates.map((c) => (
                  <div key={c.id} className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                        {c.type === "role" ? c.role_title : c.skill_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                        {c.type === "role" ? "Role certificate" : "Skill certificate"} · Issued {shortDate(c.issued_at)}
                      </div>
                    </div>
                    <a href={c.verify_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 600, color: "var(--purple)", whiteSpace: "nowrap" }}>
                      Verify
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="AI Mock Interviews">
            {interviews.length === 0 ? (
              <Empty>No mock interviews attended yet.</Empty>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "16px", marginBottom: "16px" }}>
                  <ChartCard title="Interview score progression (0–10)">
                    <ApexChart
                      type="line"
                      height={240}
                      series={[{ name: "Score", data: ratedInterviews.map((i) => Number(i.overall_rating)) }]}
                      options={{
                        ...BASE_CHART_OPTIONS,
                        chart: { ...BASE_CHART_OPTIONS.chart, type: "line" },
                        stroke: { curve: "smooth", width: 3 },
                        colors: ["#7C3AED"],
                        markers: { size: 5 },
                        xaxis: { categories: ratedInterviews.map((i) => shortDate(i.created_at)), labels: { rotate: -30, hideOverlappingLabels: true } },
                        yaxis: { min: 0, max: 10 },
                      }}
                    />
                  </ChartCard>
                  <div className="card" style={{ padding: "20px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>Interview summary</div>
                    {([
                      ["Total interviews", String(interviews.length)],
                      ["Average score", avgInterview !== null ? `${avgInterview.toFixed(1)} / 10` : "—"],
                      ["Latest score", ratedInterviews.length ? `${ratedInterviews[ratedInterviews.length - 1].overall_rating} / 10` : "—"],
                      ["Improvement since first", ratedInterviews.length > 1 ? `${((ratedInterviews[ratedInterviews.length - 1].overall_rating as number) - (ratedInterviews[0].overall_rating as number)).toFixed(1)} pts` : "—"],
                    ] as const).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "14px" }}>
                        <span style={{ color: "var(--muted)" }}>{k}</span>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 8px" }}>Date</th>
                        <th style={{ padding: "12px 8px" }}>Role</th>
                        <th style={{ padding: "12px 8px" }}>Score</th>
                        <th style={{ padding: "12px 8px" }}>Strengths</th>
                        <th style={{ padding: "12px 8px" }}>To improve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...interviews].reverse().map((i) => (
                        <tr key={i.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                          <td style={{ padding: "12px 8px", color: "var(--muted)", whiteSpace: "nowrap" }}>{shortDate(i.created_at)}</td>
                          <td style={{ padding: "12px 8px", fontWeight: 500, color: "var(--text)" }}>{i.role || i.category || "—"}</td>
                          <td style={{ padding: "12px 8px", fontWeight: 700 }}>{i.overall_rating ?? "—"}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: "var(--muted)" }}>{toList(i.strengths).join(", ") || "—"}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: "var(--muted)" }}>{toList(i.improvements).join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>

          <Section title="Detailed Test History">
            {history.length === 0 ? (
              <Empty>No assessments completed by this student yet.</Empty>
            ) : (
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
                    {[...history].reverse().map((a) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 8px", color: "var(--muted)" }}>{shortDate(a.created_at)}</td>
                        <td style={{ padding: "12px 8px", fontWeight: 500, color: "var(--text)" }}>{a.score} / {a.max_score}</td>
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1, height: "6px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${a.percentage}%`, background: scoreColor(a.percentage) }} />
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 600, width: "36px", color: "var(--text)" }}>{Math.round(a.percentage)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right" }}>
                          <span style={{ padding: "4px 8px", background: a.passed ? "#e6f4ea" : "#fee2e2", color: a.passed ? "#1e8e3e" : "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                            {a.passed ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
