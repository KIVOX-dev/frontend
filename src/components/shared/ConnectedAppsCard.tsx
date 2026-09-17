"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarHeatmap, type DayCount } from "@/components/shared/CalendarHeatmap";
import { useUiStore } from "@/stores/uiStore";

type ConnectedAppsProfile = {
  github_username?: string | null;
  github_avatar_url?: string | null;
  github_connected_at?: string | null;
  leetcode_username?: string | null;
  hackerrank_username?: string | null;
  dribbble_username?: string | null;
  linkedin_name?: string | null;
  linkedin_avatar_url?: string | null;
  linkedin_connected_at?: string | null;
  stackoverflow_display_name?: string | null;
  stackoverflow_reputation?: number | null;
  stackoverflow_profile_url?: string | null;
  stackoverflow_connected_at?: string | null;
};

// Same brand marks as ProfilePanel.tsx's Integrations tab (Simple Icons,
// rendered in each brand's own color) — duplicated here rather than shared
// because ProfilePanel's copies aren't exported and this card is read-only
// (no connect/disconnect wiring), so there's nothing else to share.
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.421-.012 2.751 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
function LeetCodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: "#FFA116" }} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}
function HackerRankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: "#00EA64" }} aria-hidden="true">
      <path d="M0 0v24h24V0zm9.95 8.002h1.805c.061 0 .111.05.111.111v7.767c0 .061-.05.111-.11.111H9.95c-.061 0-.111-.05-.111-.11v-2.87H7.894v2.87c0 .06-.05.11-.11.11H5.976a.11.11 0 01-.11-.11V8.112c0-.06.05-.11.11-.11h1.806c.061 0 .11.05.11.11v2.869H9.84v-2.87c0-.06.05-.11.11-.11zm2.999 0h5.778c.061 0 .111.05.111.11v7.767a.11.11 0 01-.11.112h-5.78a.11.11 0 01-.11-.11V8.111c0-.06.05-.11.11-.11z" />
    </svg>
  );
}
function DribbbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: "#EA4C89" }} aria-hidden="true">
      <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z" />
    </svg>
  );
}
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: "#0A66C2" }} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.06 2.06 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zM7.119 20.452H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
}
function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ color: "#F58025" }} aria-hidden="true">
      <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154Z" />
    </svg>
  );
}

type LeetcodeStats = {
  ranking: number | null;
  reputation: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  submissionCalendar: DayCount[];
};

function LeetCodeStats({ username }: { username: string }) {
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

function HackerRankStats({ username }: { username: string }) {
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

function ConnectedAppRow({
  icon: Icon,
  label,
  connected,
  detail,
  connectedAt,
  onConnect,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  connected: boolean;
  detail?: string | null;
  connectedAt?: string | null;
  onConnect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{label}</p>
            <p className="text-small truncate">
              {connected
                ? [detail, connectedAt ? `Connected ${new Date(connectedAt).toLocaleDateString()}` : null]
                    .filter(Boolean)
                    .join(" · ")
                : "Not connected"}
            </p>
          </div>
        </div>
        {connected ? (
          <Badge tone="success" className="shrink-0">
            Connected
          </Badge>
        ) : (
          <Button size="sm" variant="secondary" onClick={onConnect} className="shrink-0">
            Connect
          </Button>
        )}
      </div>
      {connected && children && <div className="mt-4 pt-4 border-t border-line">{children}</div>}
    </div>
  );
}

/**
 * Read-only "connected apps" summary for the My Activity screen — GitHub,
 * LinkedIn, Stack Overflow, LeetCode, HackerRank and Dribbble, with the same
 * real stats (rank, solved counts, badges) shown on the Profile page's
 * Integrations tab. Actually connecting/disconnecting stays on Profile —
 * this card only shows current state and links there for anything unconnected.
 */
export function ConnectedAppsCard() {
  const [profile, setProfile] = useState<ConnectedAppsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ConnectedAppsProfile>("/students/profile")
      .then((res) => {
        if (!cancelled) setProfile(res.data);
      })
      .catch(() => {
        // No student profile yet (or this role has none) — quietly omit the
        // card rather than surfacing an error on an activity/history screen.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goToIntegrations = () => setActiveScreen("profile-info");

  if (loading) {
    return (
      <div className="card" style={{ padding: "20px" }}>
        <p className="text-small">Loading connected apps…</p>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Connected Apps</div>
        <Button size="sm" variant="secondary" onClick={goToIntegrations}>
          Manage in Profile
        </Button>
      </div>
      <div className="space-y-3">
        <ConnectedAppRow
          icon={GitHubIcon}
          label="GitHub"
          connected={!!profile.github_username}
          detail={profile.github_username ? `@${profile.github_username}` : null}
          connectedAt={profile.github_connected_at}
          onConnect={goToIntegrations}
        />
        <ConnectedAppRow
          icon={LinkedInIcon}
          label="LinkedIn"
          connected={!!profile.linkedin_name}
          detail={profile.linkedin_name}
          connectedAt={profile.linkedin_connected_at}
          onConnect={goToIntegrations}
        />
        <ConnectedAppRow
          icon={StackOverflowIcon}
          label="Stack Overflow"
          connected={!!profile.stackoverflow_display_name}
          detail={
            profile.stackoverflow_display_name
              ? `${profile.stackoverflow_display_name} · ${profile.stackoverflow_reputation ?? 0} reputation`
              : null
          }
          connectedAt={profile.stackoverflow_connected_at}
          onConnect={goToIntegrations}
        />
        <ConnectedAppRow
          icon={LeetCodeIcon}
          label="LeetCode"
          connected={!!profile.leetcode_username}
          detail={profile.leetcode_username ? `@${profile.leetcode_username}` : null}
          onConnect={goToIntegrations}
        >
          {profile.leetcode_username && <LeetCodeStats username={profile.leetcode_username} />}
        </ConnectedAppRow>
        <ConnectedAppRow
          icon={HackerRankIcon}
          label="HackerRank"
          connected={!!profile.hackerrank_username}
          detail={profile.hackerrank_username ? `@${profile.hackerrank_username}` : null}
          onConnect={goToIntegrations}
        >
          {profile.hackerrank_username && <HackerRankStats username={profile.hackerrank_username} />}
        </ConnectedAppRow>
        <ConnectedAppRow
          icon={DribbbleIcon}
          label="Dribbble"
          connected={!!profile.dribbble_username}
          detail={profile.dribbble_username ? `@${profile.dribbble_username}` : null}
          onConnect={goToIntegrations}
        />
      </div>
    </div>
  );
}
