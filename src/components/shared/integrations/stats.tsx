"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { CalendarHeatmap, type DayCount } from "@/components/shared/CalendarHeatmap";

// Real per-connection stats (rank, solved counts, badges) fetched from
// LeetCode/HackerRank's own public APIs — see socialProfileClient.js's
// fetchLeetcodeStats/fetchHackerrankStats on the backend. Shared by every
// place a connected LeetCode/HackerRank username is shown (Profile's
// Integrations tab, Settings' Integrations tab, the My Activity summary card).

type LeetcodeStats = {
  ranking: number | null;
  reputation: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  submissionCalendar: DayCount[];
};

export function LeetCodeStats({ username }: { username: string }) {
  const [stats, setStats] = useState<LeetcodeStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError("");
    api
      .get<LeetcodeStats>("/students/profile/leetcode-stats")
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(extractErrorMessage(err, "Couldn't load LeetCode stats"));
      });
    return () => {
      cancelled = true;
    };
    // Re-fetches if the connected username changes — `username` isn't sent to
    // the endpoint itself (the backend reads it from the student's own saved
    // profile), it's only the trigger for "the connection changed, stats are stale."
  }, [username]);

  if (error) return <p className="text-small text-danger">{error}</p>;
  if (!stats) return <p className="text-small">Loading LeetCode stats…</p>;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-caption mb-0.5">Global Rank</p>
          <p className="text-sm font-semibold text-ink">{stats.ranking ? `#${stats.ranking.toLocaleString()}` : "—"}</p>
        </div>
        <div>
          <p className="text-caption mb-0.5">Total Solved</p>
          <p className="text-sm font-semibold text-ink">{stats.totalSolved}</p>
        </div>
        <div>
          <p className="text-caption mb-0.5">Easy / Medium / Hard</p>
          <p className="text-sm font-semibold text-ink">
            {stats.easySolved} / {stats.mediumSolved} / {stats.hardSolved}
          </p>
        </div>
        <div>
          <p className="text-caption mb-0.5">Reputation</p>
          <p className="text-sm font-semibold text-ink">{stats.reputation ?? "—"}</p>
        </div>
      </div>
      <CalendarHeatmap days={stats.submissionCalendar} unit="submission" />
    </div>
  );
}

type HackerrankBadge = { name: string; stars: number; totalStars: number; solved: number; totalChallenges: number };
type HackerrankStats = { level: number | null; title: string | null; followers: number; badges: HackerrankBadge[] };

export function HackerRankStats({ username }: { username: string }) {
  const [stats, setStats] = useState<HackerrankStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError("");
    api
      .get<HackerrankStats>("/students/profile/hackerrank-stats")
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(extractErrorMessage(err, "Couldn't load HackerRank stats"));
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error) return <p className="text-small text-danger">{error}</p>;
  if (!stats) return <p className="text-small">Loading HackerRank stats…</p>;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-caption mb-0.5">Level</p>
          <p className="text-sm font-semibold text-ink">{stats.level ?? "—"}</p>
        </div>
        <div>
          <p className="text-caption mb-0.5">Title</p>
          <p className="text-sm font-semibold text-ink">{stats.title || "—"}</p>
        </div>
        <div>
          <p className="text-caption mb-0.5">Followers</p>
          <p className="text-sm font-semibold text-ink">{stats.followers}</p>
        </div>
      </div>
      {stats.badges.length === 0 ? (
        <p className="text-small">No public badges yet.</p>
      ) : (
        <div className="space-y-2">
          {stats.badges.map((badge) => (
            <div key={badge.name} className="flex items-center justify-between gap-3 text-small">
              <span className="text-ink font-medium">{badge.name}</span>
              <span className="text-ink-muted">
                {badge.stars}/{badge.totalStars} stars · {badge.solved}/{badge.totalChallenges} solved
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
