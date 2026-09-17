"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ShieldCheck, GraduationCap, LogOut, Pencil, Plug, Unlink } from "lucide-react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Label, Input, FieldError } from "@/components/ui/Input";
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
};

type Department = { id: string; name: string };

type Tab = "profile" | "security" | "student" | "integrations";

// lucide-react ships no brand/logo icons (see githubOAuthState.js's caller
// for the backend side of this feature) — hand-rolled inline SVG, same
// pattern as LearnerShell.tsx's custom nav icons.
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.421-.012 2.751 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// None of these three have a public OAuth surface a third party can
// register against (unlike GitHub) — badges instead of real brand logos
// (same reasoning as GitHubIcon above), and the profile save itself is
// best-effort verified server-side (see studentProfile.service.js's
// _verifyAndNormalize) rather than a real authenticated connection.
function LeetCodeIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-xs font-bold text-white", className)} style={{ background: "#FFA116" }} aria-hidden="true">
      LC
    </div>
  );
}
function HackerRankIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-xs font-bold text-white", className)} style={{ background: "#00A551" }} aria-hidden="true">
      HR
    </div>
  );
}
function DribbbleIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-full text-xs font-bold text-white", className)} style={{ background: "#EA4C89" }} aria-hidden="true">
      Dr
    </div>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-xs font-bold text-white", className)} style={{ background: "#0A66C2" }} aria-hidden="true">
      in
    </div>
  );
}
function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-xs font-bold text-white", className)} style={{ background: "#F48024" }} aria-hidden="true">
      SO
    </div>
  );
}

// Shared by GitHub/LinkedIn/Stack Overflow — every one of them is a real
// OAuth connection (see githubAuth/linkedinAuth/stackexchangeAuth service.js
// on the backend), so unlike SocialIntegrationRow above, connecting always
// means a full browser redirect to the provider's own consent screen, never
// a typed-in username.
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
  { field: "leetcodeUsername", profileKey: "leetcode_username", label: "LeetCode", blurb: "Highlight your problem-solving skills.", icon: LeetCodeIcon },
  { field: "hackerrankUsername", profileKey: "hackerrank_username", label: "HackerRank", blurb: "Prove your expertise through coding badges.", icon: HackerRankIcon },
  { field: "dribbbleUsername", profileKey: "dribbble_username", label: "Dribbble", blurb: "Display your creative design portfolio.", icon: DribbbleIcon },
] as const;

function SocialIntegrationRow({
  icon: Icon,
  label,
  blurb,
  username,
  suggestedUsername,
  onSave,
  renderExtra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  blurb: string;
  username?: string | null;
  // People often reuse the same handle across sites — pre-filling with the
  // student's already-verified GitHub username saves typing for the common
  // case, but it's only ever a starting guess: onSave still runs the same
  // server-side verification as a manually typed one, so a wrong guess is
  // rejected exactly like any other bad username would be.
  suggestedUsername?: string | null;
  onSave: (value: string) => Promise<void>;
  // LeetCode only, for now — real stats (rank, solved counts, submission
  // calendar) fetched from a dedicated endpoint once connected. Nothing else
  // in SOCIAL_INTEGRATIONS has an equivalent public data source to show.
  renderExtra?: (username: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!value.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(value.trim());
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
              setValue(suggestedUsername || "");
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
          {suggestedUsername && value === suggestedUsername && (
            <p className="text-caption mb-1.5">Guessed from your GitHub username — confirm or edit it.</p>
          )}
          <div className="flex items-center gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={`Your ${label} username`} className="h-9" autoFocus />
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

function TabButton({
  active,
  icon: Icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-left transition-colors duration-150 w-full",
        active ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-paper-tint hover:text-ink"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  );
}

export function SettingsPanel() {
  const { user, logout } = useAuthStore();
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

  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdError("");
    setChangingPwd(true);
    try {
      await api.put("/auth/change-password", pwdForm);
      setPwdMsg("Password changed successfully.");
      setPwdForm({ current_password: "", new_password: "" });
    } catch (err: unknown) {
      setPwdError(extractErrorMessage(err, "Failed to change password"));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-l mb-1">Settings</h1>
        <p className="text-body text-ink-muted">Manage your account and profile.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: identity + tabs */}
        <div className="md:w-64 shrink-0 space-y-4">
          <Card className="flex flex-col items-center text-center py-8">
            <Avatar fallback={initials} size="lg" className="mb-3" />
            <p className="font-semibold text-ink truncate max-w-full">{user?.name}</p>
            <p className="text-small truncate max-w-full">{user?.email}</p>
            <Badge tone="success" className="mt-3 capitalize">
              {user?.role?.replace("_", " ")}
            </Badge>
          </Card>

          <nav className="flex md:flex-col gap-1">
            <TabButton active={activeTab === "profile"} icon={User} onClick={() => setActiveTab("profile")}>
              Profile
            </TabButton>
            <TabButton active={activeTab === "security"} icon={ShieldCheck} onClick={() => setActiveTab("security")}>
              Security
            </TabButton>
            {isStudent && (
              <TabButton active={activeTab === "student"} icon={GraduationCap} onClick={() => setActiveTab("student")}>
                Student Details
              </TabButton>
            )}
            {isStudent && (
              <TabButton active={activeTab === "integrations"} icon={Plug} onClick={() => setActiveTab("integrations")}>
                Integrations
              </TabButton>
            )}
          </nav>

          <Button variant="danger" className="w-full justify-center" onClick={handleLogout}>
            <LogOut className="size-4" />
            Log Out
          </Button>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <Card>
              <h2 className="text-section-title mb-5">Profile</h2>
              <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
                <ReadOnlyField label="Name" value={user?.name} />
                <ReadOnlyField label="Email" value={user?.email} />
                <ReadOnlyField label="Role" value={<span className="capitalize">{user?.role?.replace("_", " ")}</span>} />
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="max-w-md">
              <h2 className="text-section-title mb-5">Change Password</h2>
              {pwdMsg && <p className="text-small text-success mb-4">{pwdMsg}</p>}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Field>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={pwdForm.current_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={pwdForm.new_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                    placeholder="Must contain letters and numbers"
                    required
                    error={pwdError}
                  />
                  <FieldError>{pwdError}</FieldError>
                </Field>
                <Button type="submit" className="w-full justify-center" loading={changingPwd}>
                  Update Password
                </Button>
              </form>
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
                    username={studentProfile?.[integration.profileKey]}
                    suggestedUsername={studentProfile?.github_username}
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
    </div>
  );
}
