"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Unlink, Camera } from "lucide-react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Label, Input } from "@/components/ui/Input";
import { CalendarHeatmap, type DayCount } from "@/components/shared/CalendarHeatmap";
import { cn } from "@/lib/utils";

type StudentProfile = {
  id: string;
  department_id?: string | null;
  roll_number?: string | null;
  batch_year?: number | null;
  cgpa?: number | null;
  placement_status?: string | null;
  year_of_study?: number | null;
  semester?: number | null;
  section?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  tests_completed?: number | null;
  avg_accuracy?: number | null;
  streak_days?: number | null;
  interviews_completed?: number | null;
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
  avatar_url?: string | null;
  cover_image_url?: string | null;
};

type Department = { id: string; name: string };

type Tab = "profile" | "student" | "integrations";

// lucide-react ships no brand/logo icons — hand-rolled inline SVG, same
// pattern as LearnerShell.tsx's custom nav icons.
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.421-.012 2.751 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// Real brand marks (Simple Icons, MIT-licensed single-path SVGs), rendered
// in each brand's own official color via currentColor — same technique as
// GitHubIcon above, just with a color applied instead of inheriting text-ink.
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

// Shared by GitHub/LinkedIn/Stack Overflow — every one of them is a real
// OAuth connection (see githubAuth/linkedinAuth/stackexchangeAuth service.js
// on the backend), so connecting always means a full browser redirect to the
// provider's own consent screen, never a typed-in username.
function OAuthIntegrationRow({
  icon: Icon,
  label,
  blurb,
  connectedLabel,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  blurb: string;
  connectedLabel?: string | null;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{label}</p>
          <p className="text-small truncate">{connectedLabel || blurb}</p>
        </div>
      </div>
      {connectedLabel ? (
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone="success">Connected</Badge>
          <Button variant="secondary" size="sm" onClick={onDisconnect} loading={disconnecting}>
            <Unlink className="size-3.5" />
            Disconnect
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={onConnect} loading={connecting} className="shrink-0">
          Connect
        </Button>
      )}
    </div>
  );
}

const SOCIAL_INTEGRATIONS = [
  {
    field: "leetcodeUsername",
    profileKey: "leetcode_username",
    label: "LeetCode",
    blurb: "Highlight your problem-solving skills.",
    icon: LeetCodeIcon,
    placeholder: "username or https://leetcode.com/u/username",
  },
  {
    field: "hackerrankUsername",
    profileKey: "hackerrank_username",
    label: "HackerRank",
    blurb: "Prove your expertise through coding badges.",
    icon: HackerRankIcon,
    placeholder: "username or https://www.hackerrank.com/profile/username",
  },
  {
    field: "dribbbleUsername",
    profileKey: "dribbble_username",
    label: "Dribbble",
    blurb: "Display your creative design portfolio.",
    icon: DribbbleIcon,
    placeholder: "username or https://dribbble.com/username",
  },
] as const;

// Accepts either a bare username or a full profile URL and returns just the
// username — the last non-empty path segment is the username on all three
// sites (leetcode.com/u/x, hackerrank.com/profile/x, dribbble.com/x), so one
// generic parser covers all of them without per-site regex. A bare username
// with no slashes/dots just passes through unchanged (new URL() on it
// resolves to an empty path, so this falls through to the raw input).
function extractUsername(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const segments = new URL(withScheme).pathname.split("/").filter(Boolean);
    return segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : trimmed;
  } catch {
    return trimmed;
  }
}

function SocialIntegrationRow({
  icon: Icon,
  label,
  blurb,
  placeholder,
  username,
  onSave,
  renderExtra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  blurb: string;
  placeholder: string;
  username?: string | null;
  onSave: (value: string) => Promise<void>;
  // LeetCode/HackerRank only, for now — real stats (rank, badges, submission
  // calendar) fetched from a dedicated endpoint once connected. Dribbble has
  // no equivalent public data source to show.
  renderExtra?: (username: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    const parsed = extractUsername(value);
    if (!parsed) return;
    setSaving(true);
    setError("");
    try {
      await onSave(parsed);
      setEditing(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, `Couldn't connect ${label}`));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect ${label}?`)) return;
    setSaving(true);
    setError("");
    try {
      await onSave("");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, `Couldn't disconnect ${label}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{label}</p>
            {!editing && <p className="text-small truncate">{username ? `Connected as @${username}` : blurb}</p>}
          </div>
        </div>
        {username && !editing ? (
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone="success">Connected</Badge>
            <Button variant="secondary" size="sm" onClick={handleDisconnect} loading={saving}>
              <Unlink className="size-3.5" />
              Disconnect
            </Button>
          </div>
        ) : !editing ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setValue("");
              setError("");
              setEditing(true);
            }}
            className="shrink-0"
          >
            Connect
          </Button>
        ) : null}
      </div>

      {username && !editing && renderExtra && <div className="mt-4 pt-4 border-t border-line">{renderExtra(username)}</div>}

      {editing && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="h-9" autoFocus />
            <Button size="sm" onClick={handleConnect} loading={saving} disabled={!value.trim()}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-small text-danger mt-2">{error}</p>}
    </div>
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

// The one thing GoodFreshers' reference "Connect with LeetCode" modal
// promises ("global rank, stats and submission graph") that a bare stored
// username doesn't deliver on its own — fetched from LeetCode's public
// GraphQL API server-side (see socialProfileClient.js#fetchLeetcodeStats),
// on demand, only once the row is actually showing "Connected".
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
    // Re-fetches if the connected username changes (e.g. reconnected under a
    // different handle) — `username` isn't sent to the endpoint itself (the
    // backend reads it from the student's own saved profile), it's only the
    // trigger for "the connection changed, stats are stale."
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

// Same idea as LeetCodeStats above — real per-skill badges (name, stars
// earned, problems solved) fetched from HackerRank's own public badges
// endpoint, matching the reference screenshot's "Prove your expertise
// through coding badges" promise with actual data instead of a stored
// username alone.
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

function capitalize(value?: string | null) {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption mb-1">{label}</p>
      <p className="text-sm font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}

// Horizontal, underline-style tab — matches the reference profile page's tab
// row (About / Career / Projects & Activities / ...), unlike SettingsPanel's
// vertical sidebar tabs.
function ProfileTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 text-sm font-medium rounded-t-md -mb-px border-b-2 transition-colors duration-150 whitespace-nowrap",
        active ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

/**
 * The student's own profile — basic info, Student Details (academic record),
 * and Integrations (GitHub/LinkedIn/Stack Overflow real OAuth connections,
 * plus LeetCode/HackerRank/Dribbble username-based ones). Separate from
 * SettingsPanel.tsx (account security only) — this is "who you are",
 * that's "how you log in."
 */
export function ProfilePanel() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "student";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [githubMsg, setGithubMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [disconnectingLinkedin, setDisconnectingLinkedin] = useState(false);
  const [linkedinMsg, setLinkedinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connectingStackoverflow, setConnectingStackoverflow] = useState(false);
  const [disconnectingStackoverflow, setDisconnectingStackoverflow] = useState(false);
  const [stackoverflowMsg, setStackoverflowMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [coverError, setCoverError] = useState("");

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profileLoading, setProfileLoading] = useState(isStudent);
  const [profileMissing, setProfileMissing] = useState(false);

  // Only fields PUT /students/profile actually accepts — batch_year, cgpa,
  // placement_status, and the stat fields below are admin/system-managed
  // and stay read-only display.
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    department_id: "",
    roll_number: "",
    year_of_study: "",
    semester: "",
    section: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (!isStudent) return;
    Promise.all([
      api.get<StudentProfile>("/students/profile"),
      api.get<Department[]>("/departments").catch(() => ({ data: [] })),
    ])
      .then(([profileRes, deptRes]) => {
        setStudentProfile(profileRes.data);
        setDepartments(deptRes.data || []);
      })
      .catch(() => setProfileMissing(true))
      .finally(() => setProfileLoading(false));
  }, [isStudent]);

  // Lands here once, right after an OAuth callback redirect (GitHub/
  // LinkedIn/Stack Overflow — see their respective *AuthService.js on the
  // backend) sends the browser back with
  // `?tab=integrations&<provider>=connected|error&reason=...`. Reads it,
  // surfaces a message, then strips the query string so refreshing or
  // re-sharing the URL doesn't replay the same success/error message.
  useEffect(() => {
    const tab = searchParams.get("tab");
    const github = searchParams.get("github");
    const linkedin = searchParams.get("linkedin");
    const stackoverflow = searchParams.get("stackoverflow");
    if (!tab && !github && !linkedin && !stackoverflow) return;

    if (tab === "integrations") setActiveTab("integrations");

    const reason = searchParams.get("reason") || "";
    if (github === "connected") {
      setGithubMsg({ type: "success", text: "GitHub connected." });
    } else if (github === "error") {
      const reasons: Record<string, string> = {
        denied: "GitHub authorization was cancelled.",
        already_linked: "That GitHub account is already connected to another student.",
        expired: "That connection attempt expired — please try again.",
        no_profile: "Set up your student profile before connecting GitHub.",
      };
      setGithubMsg({ type: "error", text: reasons[reason] || "Couldn't connect GitHub — please try again." });
    }
    if (linkedin === "connected") {
      setLinkedinMsg({ type: "success", text: "LinkedIn connected." });
    } else if (linkedin === "error") {
      const reasons: Record<string, string> = {
        denied: "LinkedIn authorization was cancelled.",
        already_linked: "That LinkedIn account is already connected to another student.",
        expired: "That connection attempt expired — please try again.",
        no_profile: "Set up your student profile before connecting LinkedIn.",
      };
      setLinkedinMsg({ type: "error", text: reasons[reason] || "Couldn't connect LinkedIn — please try again." });
    }
    if (stackoverflow === "connected") {
      setStackoverflowMsg({ type: "success", text: "Stack Overflow connected." });
    } else if (stackoverflow === "error") {
      const reasons: Record<string, string> = {
        denied: "Stack Overflow authorization was cancelled.",
        already_linked: "That Stack Overflow account is already connected to another student.",
        expired: "That connection attempt expired — please try again.",
        no_profile: "Set up your student profile before connecting Stack Overflow.",
      };
      setStackoverflowMsg({ type: "error", text: reasons[reason] || "Couldn't connect Stack Overflow — please try again." });
    }

    router.replace(window.location.pathname, { scroll: false });
    // Only ever meant to process the redirect's own query string once, on
    // arrival — re-running on every searchParams identity change would loop
    // against the replace() above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentName = departments.find((d) => d.id === studentProfile?.department_id)?.name;

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // mirrors the backend's own cap (upload.js) — fail fast client-side too

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-selected later (e.g. after fixing an error)
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setAvatarError("Image must be under 5MB.");
      return;
    }
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      // Content-Type: undefined drops the axios instance's default
      // application/json header so the browser sets the correct
      // multipart/form-data boundary itself — explicitly setting
      // "multipart/form-data" here would omit that boundary and break the upload.
      const res = await api.post<StudentProfile>("/students/profile/avatar", formData, {
        headers: { "Content-Type": undefined },
      } as ApiRequestConfig);
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setAvatarError(extractErrorMessage(err, "Couldn't upload photo"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setCoverError("Image must be under 5MB.");
      return;
    }
    setUploadingCover(true);
    setCoverError("");
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await api.post<StudentProfile>("/students/profile/cover", formData, {
        headers: { "Content-Type": undefined },
      } as ApiRequestConfig);
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setCoverError(extractErrorMessage(err, "Couldn't upload cover image"));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleConnectGithub = async () => {
    setConnectingGithub(true);
    setGithubMsg(null);
    try {
      const res = await api.get<{ url: string }>("/auth/github/connect", { cache: false } as ApiRequestConfig);
      window.location.href = res.data.url;
    } catch (err: unknown) {
      setGithubMsg({ type: "error", text: extractErrorMessage(err, "Couldn't start the GitHub connection") });
      setConnectingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!window.confirm("Disconnect your GitHub account?")) return;
    setDisconnectingGithub(true);
    setGithubMsg(null);
    try {
      const res = await api.delete<StudentProfile>("/auth/github/disconnect");
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setGithubMsg({ type: "error", text: extractErrorMessage(err, "Couldn't disconnect GitHub") });
    } finally {
      setDisconnectingGithub(false);
    }
  };

  const handleConnectLinkedin = async () => {
    setConnectingLinkedin(true);
    setLinkedinMsg(null);
    try {
      const res = await api.get<{ url: string }>("/auth/linkedin/connect", { cache: false } as ApiRequestConfig);
      window.location.href = res.data.url;
    } catch (err: unknown) {
      setLinkedinMsg({ type: "error", text: extractErrorMessage(err, "Couldn't start the LinkedIn connection") });
      setConnectingLinkedin(false);
    }
  };

  const handleDisconnectLinkedin = async () => {
    if (!window.confirm("Disconnect your LinkedIn account?")) return;
    setDisconnectingLinkedin(true);
    setLinkedinMsg(null);
    try {
      const res = await api.delete<StudentProfile>("/auth/linkedin/disconnect");
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setLinkedinMsg({ type: "error", text: extractErrorMessage(err, "Couldn't disconnect LinkedIn") });
    } finally {
      setDisconnectingLinkedin(false);
    }
  };

  const handleConnectStackoverflow = async () => {
    setConnectingStackoverflow(true);
    setStackoverflowMsg(null);
    try {
      const res = await api.get<{ url: string }>("/auth/stackexchange/connect", { cache: false } as ApiRequestConfig);
      window.location.href = res.data.url;
    } catch (err: unknown) {
      setStackoverflowMsg({ type: "error", text: extractErrorMessage(err, "Couldn't start the Stack Overflow connection") });
      setConnectingStackoverflow(false);
    }
  };

  const handleDisconnectStackoverflow = async () => {
    if (!window.confirm("Disconnect your Stack Overflow account?")) return;
    setDisconnectingStackoverflow(true);
    setStackoverflowMsg(null);
    try {
      const res = await api.delete<StudentProfile>("/auth/stackexchange/disconnect");
      setStudentProfile(res.data);
    } catch (err: unknown) {
      setStackoverflowMsg({ type: "error", text: extractErrorMessage(err, "Couldn't disconnect Stack Overflow") });
    } finally {
      setDisconnectingStackoverflow(false);
    }
  };

  // Shared by LeetCode/HackerRank/Dribbble — an empty value clears the field
  // (Disconnect), a non-empty one is best-effort verified server-side (see
  // studentProfile.service.js#_verifyAndNormalize) before saving, so a
  // rejection here means the site itself said that username doesn't exist.
  const handleSaveSocial = async (field: string, value: string) => {
    const res = await api.put<StudentProfile>("/students/profile", { [field]: value });
    setStudentProfile(res.data);
  };

  const startEditingProfile = () => {
    if (!studentProfile) return;
    setProfileForm({
      department_id: studentProfile.department_id || "",
      roll_number: studentProfile.roll_number || "",
      year_of_study: studentProfile.year_of_study?.toString() || "",
      semester: studentProfile.semester?.toString() || "",
      section: studentProfile.section || "",
      phone: studentProfile.phone || "",
      date_of_birth: studentProfile.date_of_birth ? studentProfile.date_of_birth.slice(0, 10) : "",
      gender: studentProfile.gender || "",
      address: studentProfile.address || "",
    });
    setProfileMsg("");
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await api.put<StudentProfile>("/students/profile", {
        departmentId: profileForm.department_id || undefined,
        rollNumber: profileForm.roll_number || undefined,
        year: profileForm.year_of_study ? Number(profileForm.year_of_study) : undefined,
        semester: profileForm.semester ? Number(profileForm.semester) : undefined,
        section: profileForm.section || undefined,
        phone: profileForm.phone,
        dateOfBirth: profileForm.date_of_birth || null,
        gender: profileForm.gender,
        address: profileForm.address,
      });
      setStudentProfile(res.data);
      setEditingProfile(false);
    } catch (err: unknown) {
      setProfileMsg(extractErrorMessage(err, "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Cover banner */}
      <div className="relative h-32 md:h-40 rounded-xl overflow-hidden">
        {studentProfile?.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- externally hosted (GCS), not a static/imported asset next/image expects
          <img src={studentProfile.cover_image_url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 55%, white) 100%)" }}
          />
        )}
        {isStudent && (
          <label className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/50 hover:bg-black/65 text-white text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors">
            <Camera className="size-3.5" />
            {uploadingCover ? "Uploading…" : "Edit banner"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleUploadCover}
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>
      {coverError && <p className="text-small text-danger mt-1 px-2">{coverError}</p>}

      {/* Avatar + identity, overlapping the banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-2 -mt-12 md:-mt-14 mb-6">
        <div className="flex items-end gap-4 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              src={studentProfile?.avatar_url}
              fallback={initials}
              size="lg"
              className="size-24 md:size-28 text-3xl ring-4 ring-white shadow-md"
            />
            {isStudent && (
              <label className="absolute bottom-0 right-0 flex items-center justify-center size-8 rounded-full bg-ink text-white cursor-pointer shadow-md hover:bg-ink/90 transition-colors">
                <Camera className="size-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleUploadAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-heading-l text-ink leading-tight truncate">{user?.name}</h1>
            <p className="text-small text-ink-muted truncate">{user?.email}</p>
          </div>
        </div>
        <Badge tone="success" className="capitalize mb-2 shrink-0">
          {user?.role?.replace("_", " ")}
        </Badge>
      </div>

      {/* Kept out of the identity row above on purpose — that row uses
          items-end (bottom-aligns the fixed-height avatar against the
          name/email text), so any extra line rendered inside it shifts the
          alignment math and can visually collide with the name heading. */}
      {(avatarError || uploadingAvatar) && (
        <p className={cn("text-small px-2 mb-4 -mt-2", avatarError ? "text-danger" : "text-ink-muted")}>
          {avatarError || "Uploading photo…"}
        </p>
      )}

      {/* Horizontal tabs */}
      <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        <ProfileTabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          About
        </ProfileTabButton>
        {isStudent && (
          <ProfileTabButton active={activeTab === "student"} onClick={() => setActiveTab("student")}>
            Student Details
          </ProfileTabButton>
        )}
        {isStudent && (
          <ProfileTabButton active={activeTab === "integrations"} onClick={() => setActiveTab("integrations")}>
            Integrations
          </ProfileTabButton>
        )}
      </div>

      {/* Content */}
      <div>
        {activeTab === "profile" && (
            <Card>
              <h2 className="text-section-title mb-5">About</h2>
              <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
                <ReadOnlyField label="Name" value={user?.name} />
                <ReadOnlyField label="Email" value={user?.email} />
                <ReadOnlyField label="Role" value={<span className="capitalize">{user?.role?.replace("_", " ")}</span>} />
              </div>
            </Card>
          )}

          {activeTab === "student" && isStudent && (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-section-title">Student Details</h2>
                {!profileLoading && !profileMissing && studentProfile && !editingProfile && (
                  <Button variant="secondary" size="sm" onClick={startEditingProfile}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                )}
              </div>

              {profileLoading ? (
                <p className="text-small">Loading…</p>
              ) : profileMissing || !studentProfile ? (
                <p className="text-small">
                  Your student profile hasn&apos;t been set up yet. Contact your institution admin.
                </p>
              ) : editingProfile ? (
                <form onSubmit={handleSaveProfile}>
                  {profileMsg && <p className="text-small text-danger mb-4">{profileMsg}</p>}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <Field>
                      <Label>Roll Number</Label>
                      <Input
                        value={profileForm.roll_number}
                        onChange={(e) => setProfileForm({ ...profileForm, roll_number: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Department</Label>
                      <select
                        className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                        value={profileForm.department_id}
                        onChange={(e) => setProfileForm({ ...profileForm, department_id: e.target.value })}
                      >
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <Label>Year of Study</Label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={profileForm.year_of_study}
                        onChange={(e) => setProfileForm({ ...profileForm, year_of_study: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Semester</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={profileForm.semester}
                        onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Section</Label>
                      <Input
                        value={profileForm.section}
                        onChange={(e) => setProfileForm({ ...profileForm, section: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Gender</Label>
                      <Input
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      />
                    </Field>
                    <Field className="sm:col-span-2 lg:col-span-4">
                      <Label>Address</Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" loading={savingProfile}>
                      Save
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-7">
                  <section>
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Academic</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
                      <ReadOnlyField label="Roll Number" value={studentProfile.roll_number} />
                      <ReadOnlyField label="Department" value={departmentName} />
                      <ReadOnlyField label="Batch Year" value={studentProfile.batch_year} />
                      <ReadOnlyField label="Year of Study" value={studentProfile.year_of_study} />
                      <ReadOnlyField label="Semester" value={studentProfile.semester} />
                      <ReadOnlyField label="Section" value={studentProfile.section?.toUpperCase()} />
                    </div>
                  </section>

                  <section className="border-t border-line pt-7">
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Performance</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
                      <ReadOnlyField label="CGPA" value={studentProfile.cgpa} />
                      <ReadOnlyField label="Placement Status" value={capitalize(studentProfile.placement_status)} />
                      <ReadOnlyField label="Tests Completed" value={studentProfile.tests_completed} />
                      <ReadOnlyField
                        label="Avg Accuracy"
                        value={studentProfile.avg_accuracy != null ? `${studentProfile.avg_accuracy}%` : undefined}
                      />
                      <ReadOnlyField label="Day Streak" value={studentProfile.streak_days} />
                      <ReadOnlyField label="Interviews Completed" value={studentProfile.interviews_completed} />
                    </div>
                  </section>

                  <section className="border-t border-line pt-7">
                    <p className="text-caption font-semibold uppercase tracking-wide mb-4">Personal</p>
                    <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5 mb-5">
                      <ReadOnlyField label="Phone" value={studentProfile.phone} />
                      <ReadOnlyField label="Gender" value={capitalize(studentProfile.gender)} />
                      <ReadOnlyField
                        label="Date of Birth"
                        value={studentProfile.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : undefined}
                      />
                    </div>
                    <ReadOnlyField label="Address" value={studentProfile.address} />
                  </section>
                </div>
              )}
            </Card>
          )}

          {activeTab === "integrations" && isStudent && (
            <Card>
              <h2 className="text-section-title mb-1">Integrations</h2>
              <p className="text-small mb-5">Showcase your work by connecting your accounts.</p>

              {[githubMsg, linkedinMsg, stackoverflowMsg].map(
                (msg, i) =>
                  msg && (
                    <p key={i} className={cn("text-small mb-2", msg.type === "success" ? "text-success" : "text-danger")}>
                      {msg.text}
                    </p>
                  )
              )}

              <div className="space-y-3 mt-3">
                <OAuthIntegrationRow
                  icon={(p) => <GitHubIcon {...p} className={cn(p.className, "text-ink")} />}
                  label="GitHub"
                  blurb="Showcase your projects and contributions to recruiters."
                  connectedLabel={studentProfile?.github_username ? `Connected as @${studentProfile.github_username}` : null}
                  connecting={connectingGithub}
                  disconnecting={disconnectingGithub}
                  onConnect={handleConnectGithub}
                  onDisconnect={handleDisconnectGithub}
                />

                <OAuthIntegrationRow
                  icon={LinkedInIcon}
                  label="LinkedIn"
                  blurb="Verify your professional identity for recruiters."
                  connectedLabel={studentProfile?.linkedin_name ? `Connected as ${studentProfile.linkedin_name}` : null}
                  connecting={connectingLinkedin}
                  disconnecting={disconnectingLinkedin}
                  onConnect={handleConnectLinkedin}
                  onDisconnect={handleDisconnectLinkedin}
                />

                <OAuthIntegrationRow
                  icon={StackOverflowIcon}
                  label="Stack Overflow"
                  blurb="Show your real reputation and answers."
                  connectedLabel={
                    studentProfile?.stackoverflow_display_name
                      ? `Connected as ${studentProfile.stackoverflow_display_name} (${studentProfile.stackoverflow_reputation ?? 0} rep)`
                      : null
                  }
                  connecting={connectingStackoverflow}
                  disconnecting={disconnectingStackoverflow}
                  onConnect={handleConnectStackoverflow}
                  onDisconnect={handleDisconnectStackoverflow}
                />

                {SOCIAL_INTEGRATIONS.map((integration) => (
                  <SocialIntegrationRow
                    key={integration.field}
                    icon={integration.icon}
                    label={integration.label}
                    blurb={integration.blurb}
                    placeholder={integration.placeholder}
                    username={studentProfile?.[integration.profileKey]}
                    onSave={(value) => handleSaveSocial(integration.field, value)}
                    renderExtra={
                      integration.field === "leetcodeUsername"
                        ? (u) => <LeetCodeStats username={u} />
                        : integration.field === "hackerrankUsername"
                        ? (u) => <HackerRankStats username={u} />
                        : undefined
                    }
                  />
                ))}
              </div>
            </Card>
          )}
      </div>
    </div>
  );
}
