"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CalendarHeatmap, type DayCount } from "@/components/shared/CalendarHeatmap";

/**
 * A GitHub-contributions-style calendar heatmap. Shows the student's real
 * GitHub contribution history when they've connected a GitHub account
 * (Settings -> Integrations), otherwise falls back to this platform's own
 * activity (logins, completed practice tests, mock interviews) — the backend
 * decides which and reports it via `source` (see node-api's
 * GET /auth/me/activity-heatmap / auth.service.js#activityHeatmap). Read-only,
 * self-contained: fetches its own data, no props needed. The grid itself is
 * CalendarHeatmap — shared with the LeetCode stats card in SettingsPanel.tsx.
 */
export function ActivityHeatmap() {
  const [days, setDays] = useState<DayCount[] | null>(null);
  const [source, setSource] = useState<"github" | "platform">("platform");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/auth/me/activity-heatmap")
      .then((res) => {
        if (cancelled) return;
        setDays(res.data.days || []);
        setSource(res.data.source === "github" ? "github" : "platform");
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div style={{ color: "var(--muted)", fontSize: "13px", padding: "12px 0" }}>Couldn&apos;t load activity.</div>;
  }
  if (!days) {
    return <div style={{ color: "var(--muted)", fontSize: "13px", padding: "12px 0" }}>Loading activity…</div>;
  }

  const totalActive = days.filter((d) => d.count > 0).length;
  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "10px" }}>
        {source === "github"
          ? `${totalContributions} GitHub contribution${totalContributions === 1 ? "" : "s"} in the last year`
          : `${totalActive} active day${totalActive === 1 ? "" : "s"} in the last year`}
      </div>
      <CalendarHeatmap days={days} unit={source === "github" ? "contribution" : "activity"} />
    </div>
  );
}
