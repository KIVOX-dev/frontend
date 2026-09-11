"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/errors";

type CategoryTrend = {
  category: string;
  label: string;
  avg_percentage: number;
  attempts: number;
  // null when there isn't a full prior month to compare against yet.
  growth: number | null;
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
};

// Mirrors PracticeModule.tsx's CATEGORIES palette so the same 4 aptitude
// categories read as the same color everywhere in the app.
const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  quantitative: { color: "#2563EB", bg: "#EFF6FF" },
  logical: { color: "#16A34A", bg: "#ECFDF5" },
  verbal: { color: "#7C3AED", bg: "#F5F3FF" },
  data_interpretation: { color: "#D97706", bg: "#FFFBEB" },
};
const DEFAULT_CATEGORY_COLOR = { color: "var(--accent)", bg: "var(--accent-l)" };

export function ProfileSummarizer() {
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<ProfileSummary>("/students/profile/summary");
      setSummary(res.data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Failed to load your profile summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePrint = async () => {
    const element = document.getElementById('profile-report');
    if (!element) return;

    setIsGenerating(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       [0.2, 0.2, 0.2, 0.2],
        filename:     `${user?.name || 'Student'}_Profile_Report.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>AI Profile Summarizer</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Your performance profile and career readiness score, computed from your real activity.</p>
      </div>

      {loading && (
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading your profile summary...</div>
      )}

      {!loading && loadError && (
        <div className="card" role="alert" style={{ padding: "24px", textAlign: "center", background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#B91C1C", marginBottom: "4px" }}>Unable to load this data.</p>
          <p style={{ fontSize: "13px", color: "#991B1B", marginBottom: "12px" }}>{loadError}</p>
          <button className="btn" onClick={fetchSummary}>Try again</button>
        </div>
      )}

      {!loading && !loadError && summary && !summary.has_data && (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>No profile data yet</h3>
          <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "480px", margin: "0 auto" }}>
            {summary.executive_summary}
          </p>
        </div>
      )}

      {!loading && !loadError && summary && summary.has_data && (
      <div id="profile-report" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", background: "var(--bg)", padding: "16px" }}>

        {/* Left Column: Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="card" style={{ padding: "32px", borderTop: "4px solid var(--accent)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--accent-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="32" height="32"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12L2.3 9.7"></path><path d="M12 12l9.7 2.3"></path></svg>
              </div>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Executive Summary</h3>
                <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>
                  {summary.executive_summary}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Top Skill</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{summary.top_skill || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Weakness</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{summary.weakness || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Ideal Role</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent)" }}>{summary.ideal_role || "—"}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Growth Trends</h3>
            {summary.category_trends.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>No practice attempts yet — complete a category in Mock Practice to see trends here.</p>
            ) : (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {summary.category_trends.map(t => {
                  const palette = CATEGORY_COLORS[t.category] || DEFAULT_CATEGORY_COLOR;
                  return (
                    <div key={t.category} style={{ flex: "1 1 calc(50% - 8px)", padding: "16px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>{t.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{t.avg_percentage}%</span>
                        {t.growth === null ? (
                          <span style={{ fontSize: "12px", background: palette.bg, color: palette.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>New</span>
                        ) : (
                          <span style={{ fontSize: "12px", background: t.growth >= 0 ? "#dcfce7" : "#fee2e2", color: t.growth >= 0 ? "#15803d" : "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            {t.growth >= 0 ? "+" : ""}{t.growth}% this month
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Readiness Score */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Placement Readiness</h3>

            <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto 24px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${summary.overall_readiness}, 100`} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "42px", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{summary.overall_readiness}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>/ 100</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Aptitude:</span>
                <span style={{ color: "var(--text)" }}>{summary.aptitude_pct}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Interview:</span>
                <span style={{ color: "var(--text)" }}>{summary.interview_pct}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Resume:</span>
                <span style={{ color: "var(--text)" }}>{summary.resume_pct}%</span>
              </div>
            </div>

            <button
              className="btn btn-p"
              style={{ width: "100%" }}
              onClick={handlePrint}
              disabled={isGenerating}
            >
              {isGenerating ? "Exporting..." : "Download Full Report"}
            </button>
          </div>

        </div>

      </div>
      )}
    </div>
  );
}
