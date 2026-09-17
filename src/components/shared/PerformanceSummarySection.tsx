"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type CategoryTrend = {
  category: string;
  label: string;
  avg_percentage: number;
  attempts: number;
  // null when there isn't a full prior month to compare against yet.
  growth: number | null;
};

type FocusArea = {
  // "gap" = never attempted at all; "weak" = attempted but scoring low.
  severity: "gap" | "weak";
  text: string;
};

type ProfileSummary = {
  has_data: boolean;
  executive_summary: string;
  top_skill: string | null;
  weakness: string | null;
  ideal_role: string | null;
  overall_readiness: number;
  aptitude_pct: number;
  interview_pct: number;
  resume_pct: number;
  category_trends: CategoryTrend[];
  focus_areas: FocusArea[];
};

// Mirrors PracticeModule.tsx's CATEGORIES palette so the same 4 aptitude
// categories read as the same color everywhere in the app.
const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  quantitative: { color: "#2563EB", bg: "#EFF6FF" },
  logical: { color: "#16A34A", bg: "#ECFDF5" },
  verbal: { color: "#7C3AED", bg: "#F5F3FF" },
  data_interpretation: { color: "#D97706", bg: "#FFFBEB" },
};
const DEFAULT_CATEGORY_COLOR = { color: "var(--color-primary)", bg: "var(--paper-tint, #f4f5f7)" };

/**
 * Formerly the standalone "Profile Summarizer" screen (own sidebar nav item,
 * own route) — folded into the Profile page's About tab since it's the same
 * subject (this student, described from their own real activity), not a
 * separate destination. Rule-based, not an LLM: computed fresh from real
 * assessment/interview/resume data every call (see node-api's
 * GET /students/profile/summary / studentProfile.service.js#getSummary).
 */
export function PerformanceSummarySection() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<ProfileSummary>("/students/profile/summary");
      setSummary(res.data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Failed to load your performance summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownload = async () => {
    const element = document.getElementById("performance-summary-report");
    if (!element) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [0.2, 0.2, 0.2, 0.2],
          filename: "Performance_Summary.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch {
      setLoadError("Failed to export PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-small text-center py-6">Loading your performance summary…</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <p className="text-small text-danger font-medium mb-1">Unable to load this data.</p>
        <p className="text-small text-danger mb-3">{loadError}</p>
        <Button size="sm" variant="secondary" onClick={fetchSummary}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!summary) return null;

  if (!summary.has_data) {
    return (
      <Card className="text-center py-8">
        <h3 className="font-semibold text-ink mb-1">No performance data yet</h3>
        <p className="text-small max-w-md mx-auto">{summary.executive_summary}</p>
      </Card>
    );
  }

  return (
    <div id="performance-summary-report" className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-section-title">Performance Summary</h2>
          <Button size="sm" variant="secondary" onClick={handleDownload} loading={downloading}>
            Download Report
          </Button>
        </div>
        <p className="text-small text-ink mb-5">{summary.executive_summary}</p>

        <div className="grid sm:grid-cols-3 gap-5 pt-5 border-t border-line mb-6">
          <StatField label="Top Skill" value={summary.top_skill} />
          <StatField label="Weakness" value={summary.weakness} />
          <StatField label="Ideal Role" value={summary.ideal_role} accent />
        </div>

        <div className="flex items-center gap-8 flex-wrap pt-5 border-t border-line">
          <div className="relative size-28 shrink-0">
            <svg viewBox="0 0 36 36" className="size-full">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray={`${summary.overall_readiness}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold text-ink leading-none">{summary.overall_readiness}</div>
              <div className="text-caption">/ 100</div>
            </div>
          </div>
          <div className="flex-1 min-w-[180px] space-y-2">
            <p className="text-caption font-semibold uppercase tracking-wide mb-2">Placement Readiness</p>
            <StatRow label="Aptitude" value={summary.aptitude_pct} />
            <StatRow label="Interview" value={summary.interview_pct} />
            <StatRow label="Resume" value={summary.resume_pct} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-section-title mb-5">Growth Trends</h3>
        {summary.category_trends.length === 0 ? (
          <p className="text-small">No practice attempts yet — complete a category in Mock Practice to see trends here.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {summary.category_trends.map((t) => {
              const palette = CATEGORY_COLORS[t.category] || DEFAULT_CATEGORY_COLOR;
              return (
                <div key={t.category} className="rounded-md border border-line p-4">
                  <p className="text-small mb-2">{t.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-ink">{t.avg_percentage}%</span>
                    {t.growth === null ? (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: palette.bg, color: palette.color }}>
                        New
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded",
                          t.growth >= 0
                            ? "bg-[color-mix(in_srgb,var(--color-success)_15%,white)] text-[var(--color-success)]"
                            : "bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]"
                        )}
                      >
                        {t.growth >= 0 ? "+" : ""}
                        {t.growth}% this month
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-section-title mb-1">What To Focus On</h3>
        <p className="text-small mb-5">Every item below is a real gap in your record, not generic advice.</p>
        {summary.focus_areas.length === 0 ? (
          <p className="text-small">Nothing outstanding — every category is above 60% and your resume/interview activity is complete.</p>
        ) : (
          <div className="space-y-2.5">
            {summary.focus_areas.map((f, i) => {
              const isGap = f.severity === "gap";
              return (
                <div
                  key={i}
                  className={cn("flex gap-3 items-start rounded-md p-3 border", isGap ? "bg-[#FFFBEB] border-[#FDE68A]" : "bg-[#FEF2F2] border-[#FECACA]")}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{ background: isGap ? "#FDE68A" : "#FECACA", color: isGap ? "#92400E" : "#991B1B" }}
                  >
                    {isGap ? "Not started" : "Needs work"}
                  </span>
                  <p className="text-small text-ink">{f.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatField({ label, value, accent }: { label: string; value: string | null; accent?: boolean }) {
  return (
    <div>
      <p className="text-caption mb-1">{label}</p>
      <p className={cn("text-sm font-semibold", accent ? "text-primary" : "text-ink")}>{value || "—"}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-small">
      <span className="text-ink-muted">{label}:</span>
      <span className="font-semibold text-ink">{value}%</span>
    </div>
  );
}
