"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DayCount = { date: string; count: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKS = 53;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GitHub buckets by quartile of the observed max, not a fixed scale — a
// student with a 1-2/day habit and one with a 10/day habit both get a
// legible gradient instead of everything but the heaviest days looking
// identically "low".
function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 1) return count > 0 ? 4 : 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVEL_COLOR = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

/**
 * A GitHub-contributions-style calendar heatmap of this user's own activity
 * (logins, completed practice tests, mock interviews — see node-api's
 * GET /auth/me/activity-heatmap for exactly what's counted). Read-only,
 * self-contained: fetches its own data, no props needed.
 */
export function ActivityHeatmap() {
  const [days, setDays] = useState<DayCount[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/auth/me/activity-heatmap")
      .then((res) => {
        if (!cancelled) setDays(res.data.days || []);
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

  const countByDate = new Map(days.map((d) => [d.date, d.count]));
  const max = days.reduce((m, d) => Math.max(m, d.count), 0);

  // Build WEEKS columns ending today, each a Sun-Sat column (GitHub's own
  // layout) — start from the Sunday on/before (today - WEEKS*7 days) so the
  // grid is always full weeks, then walk forward one day at a time.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = WEEKS * 7;
  const gridStart = new Date(today.getTime() - (totalDays - 1) * MS_PER_DAY);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // back up to Sunday

  const weeks: { date: Date; count: number }[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < WEEKS + 1; w++) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), count: countByDate.get(toDateKey(cursor)) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > today) break;
  }

  // One label per week-column, only where a new month actually starts in
  // that column — avoids repeating "Sep" under every column in September.
  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const firstOfMonth = week.find((d) => d.date.getDate() <= 7);
    if (firstOfMonth && firstOfMonth.date.getMonth() !== lastMonth) {
      lastMonth = firstOfMonth.date.getMonth();
      return MONTH_LABELS[firstOfMonth.date.getMonth()];
    }
    return "";
  });

  const totalActive = days.filter((d) => d.count > 0).length;

  return (
    <div>
      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "10px" }}>
        {totalActive} active day{totalActive === 1 ? "" : "s"} in the last year
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: "3px", minWidth: `${weeks.length * 13}px` }}>
          <div style={{ display: "flex", gap: "3px", paddingLeft: "24px" }}>
            {monthLabels.map((label, i) => (
              <div key={i} style={{ width: "10px", fontSize: "10px", color: "var(--muted)" }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "24px" }}>
              {DAY_LABELS.map((label, i) => (
                <div key={i} style={{ height: "10px", fontSize: "9px", color: "var(--muted)", lineHeight: "10px" }}>
                  {label}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {week.map((day, di) => {
                  const isFuture = day.date > today;
                  const level = isFuture ? 0 : levelFor(day.count, max);
                  return (
                    <div
                      key={di}
                      title={isFuture ? undefined : `${toDateKey(day.date)}: ${day.count} activit${day.count === 1 ? "y" : "ies"}`}
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        background: isFuture ? "transparent" : LEVEL_COLOR[level],
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "11px", color: "var(--muted)" }}>
        Less
        {LEVEL_COLOR.map((color) => (
          <div key={color} style={{ width: "10px", height: "10px", borderRadius: "2px", background: color }} />
        ))}
        More
      </div>
    </div>
  );
}
