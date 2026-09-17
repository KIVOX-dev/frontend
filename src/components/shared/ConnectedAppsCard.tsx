"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";
import { GitHubIcon, LeetCodeIcon, HackerRankIcon, DribbbleIcon, LinkedInIcon, StackOverflowIcon } from "@/components/shared/integrations/icons";
import { LeetCodeStats, HackerRankStats } from "@/components/shared/integrations/stats";

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
