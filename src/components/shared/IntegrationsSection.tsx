"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Unlink } from "lucide-react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { GitHubIcon, LeetCodeIcon, HackerRankIcon, DribbbleIcon, LinkedInIcon, StackOverflowIcon } from "@/components/shared/integrations/icons";
import { LeetCodeStats, HackerRankStats } from "@/components/shared/integrations/stats";

type IntegrationsProfile = {
  github_username?: string | null;
  leetcode_username?: string | null;
  hackerrank_username?: string | null;
  dribbble_username?: string | null;
  linkedin_name?: string | null;
  stackoverflow_display_name?: string | null;
  stackoverflow_reputation?: number | null;
};

// Shared by GitHub/LinkedIn/Stack Overflow — every one of them is a real
// OAuth connection (see githubAuth/linkedinAuth/stackexchangeAuth
// service.js on the backend), so connecting always means a full browser
// redirect to the provider's own consent screen, never a typed-in username.
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
// generic parser covers all of them without per-site regex.
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

/**
 * The full "connect your accounts" panel — GitHub/LinkedIn/Stack Overflow
 * (real OAuth) plus LeetCode/HackerRank/Dribbble (username-based, best-effort
 * verified). Fully self-contained: fetches its own profile slice, owns its
 * own connect/disconnect/save mutations, and reads the OAuth callback's
 * `?github=connected|error&reason=...` query params off the URL itself.
 * Dropped into both ProfilePanel.tsx's Integrations tab and
 * SettingsPanel.tsx's Integrations tab — one component, one source of truth,
 * two entry points (matching the OAuth callback, which always lands back on
 * Profile's Integrations tab regardless of which one the user started from).
 */
export function IntegrationsSection() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "student";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<IntegrationsProfile | null>(null);
  const [loading, setLoading] = useState(isStudent);

  const [connectingGithub, setConnectingGithub] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [githubMsg, setGithubMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [disconnectingLinkedin, setDisconnectingLinkedin] = useState(false);
  const [linkedinMsg, setLinkedinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connectingStackoverflow, setConnectingStackoverflow] = useState(false);
  const [disconnectingStackoverflow, setDisconnectingStackoverflow] = useState(false);
  const [stackoverflowMsg, setStackoverflowMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isStudent) return;
    api
      .get<IntegrationsProfile>("/students/profile")
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isStudent]);

  // Lands here right after an OAuth callback redirect (GitHub/LinkedIn/Stack
  // Overflow) sends the browser back with
  // `?screen=profile-info&tab=integrations&<provider>=connected|error&reason=...`.
  useEffect(() => {
    const github = searchParams.get("github");
    const linkedin = searchParams.get("linkedin");
    const stackoverflow = searchParams.get("stackoverflow");
    if (!github && !linkedin && !stackoverflow) return;

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
      const res = await api.delete<IntegrationsProfile>("/auth/github/disconnect");
      setProfile(res.data);
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
      const res = await api.delete<IntegrationsProfile>("/auth/linkedin/disconnect");
      setProfile(res.data);
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
      const res = await api.delete<IntegrationsProfile>("/auth/stackexchange/disconnect");
      setProfile(res.data);
    } catch (err: unknown) {
      setStackoverflowMsg({ type: "error", text: extractErrorMessage(err, "Couldn't disconnect Stack Overflow") });
    } finally {
      setDisconnectingStackoverflow(false);
    }
  };

  // Shared by LeetCode/HackerRank/Dribbble — an empty value clears the field
  // (Disconnect), a non-empty one is best-effort verified server-side before
  // saving, so a rejection here means the site itself said that username
  // doesn't exist.
  const handleSaveSocial = async (field: string, value: string) => {
    const res = await api.put<IntegrationsProfile>("/students/profile", { [field]: value });
    setProfile(res.data);
  };

  if (!isStudent) return null;
  if (loading) {
    return (
      <Card>
        <p className="text-small">Loading integrations…</p>
      </Card>
    );
  }

  return (
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
          connectedLabel={profile?.github_username ? `Connected as @${profile.github_username}` : null}
          connecting={connectingGithub}
          disconnecting={disconnectingGithub}
          onConnect={handleConnectGithub}
          onDisconnect={handleDisconnectGithub}
        />

        <OAuthIntegrationRow
          icon={LinkedInIcon}
          label="LinkedIn"
          blurb="Verify your professional identity for recruiters."
          connectedLabel={profile?.linkedin_name ? `Connected as ${profile.linkedin_name}` : null}
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
            profile?.stackoverflow_display_name
              ? `Connected as ${profile.stackoverflow_display_name} (${profile.stackoverflow_reputation ?? 0} rep)`
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
            username={profile?.[integration.profileKey]}
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
  );
}
