"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Play, Award } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useUiStore } from "@/stores/uiStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type RoadmapVideo = {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  channelTitle: string | null;
};

type BadgeProgress = {
  skill_name: string;
  badge_count: number;
  certificate_issued: boolean;
  badges_remaining: number;
};

type RoadmapStep = { skill: string; videos: RoadmapVideo[]; badge_progress: BadgeProgress };

type Roadmap = {
  role: { id: string; title: string; description: string };
  steps: RoadmapStep[];
  role_certificate: { id: string; role_title: string; issued_at: string } | null;
};

function formatDuration(seconds: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * "Job Role Roadmap" tab of YoutubeCourseImport.tsx — /roadmap/roles/:id
 * (see roadmap.service.js) returns curated, cached video suggestions per
 * skill for the student's chosen role, plus their real badge progress on
 * each skill. "Add to Learnings" reuses the exact same /courses/import path
 * as the plain URL-paste tab, so an added video gets the same lesson,
 * assessment, and skill-badge pipeline as anything else on Learnings.
 */
export function JobRoleRoadmap({ targetJobRole }: { targetJobRole: string | null }) {
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(Boolean(targetJobRole));
  const [error, setError] = useState("");
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);
  const [addedVideoIds, setAddedVideoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!targetJobRole) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api
      .get<Roadmap>(`/roadmap/roles/${targetJobRole}`)
      .then((res) => setRoadmap(res.data))
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load your roadmap")))
      .finally(() => setLoading(false));
  }, [targetJobRole]);

  const handleAdd = async (video: RoadmapVideo) => {
    setAddingVideoId(video.youtubeVideoId);
    setError("");
    try {
      await api.post("/courses/import", { url: `https://www.youtube.com/watch?v=${video.youtubeVideoId}` });
      setAddedVideoIds((prev) => new Set(prev).add(video.youtubeVideoId));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't add that video"));
    } finally {
      setAddingVideoId(null);
    }
  };

  if (!targetJobRole) {
    return (
      <Card className="max-w-xl mx-auto text-center py-10">
        <h2 className="text-section-title mb-2">Choose a job role first</h2>
        <p className="text-small mb-6">Pick a target job role in Setup and we&apos;ll suggest a video roadmap for it.</p>
        <Button onClick={() => setActiveScreen("setup")}>Go to Setup</Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (error && !roadmap) {
    return <p className="text-small text-danger text-center py-10">{error}</p>;
  }

  if (!roadmap) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-section-title mb-1">{roadmap.role.title} Roadmap</h2>
        <p className="text-small">{roadmap.role.description}</p>
      </div>

      {error && <p className="text-small text-danger mb-4 text-center">{error}</p>}

      {roadmap.role_certificate && (
        <Card className="mb-6 flex items-center gap-3 border-success/40">
          <Award className="size-6 text-success shrink-0" />
          <div>
            <p className="font-semibold text-ink">{roadmap.role_certificate.role_title} certificate earned!</p>
            <p className="text-caption">You&apos;ve earned every skill badge in this roadmap.</p>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {roadmap.steps.map((step) => (
          <Card key={step.skill}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-section-title">{step.skill}</h3>
                {step.badge_progress.certificate_issued && <CheckCircle2 className="size-5 text-success" />}
              </div>
              <span
                className={cn(
                  "text-caption font-medium rounded-full px-2.5 py-1 border",
                  step.badge_progress.certificate_issued ? "border-success/40 text-success" : "border-line text-ink-muted"
                )}
              >
                {step.badge_progress.certificate_issued
                  ? "Certified"
                  : `${step.badge_progress.badge_count}/5 lessons passed`}
              </span>
            </div>

            {step.videos.length === 0 ? (
              <p className="text-small text-ink-muted">No videos available for this skill right now.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {step.videos.map((video) => {
                  const added = addedVideoIds.has(video.youtubeVideoId);
                  return (
                    <div key={video.youtubeVideoId} className="rounded-md border border-line overflow-hidden">
                      <div className="relative aspect-video bg-paper-tint">
                        {video.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnailUrl} alt={video.title} className="size-full object-cover" />
                        )}
                        {video.durationSeconds > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 text-white text-[11px] px-1.5 py-0.5">
                            {formatDuration(video.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-small font-medium text-ink line-clamp-2 mb-0.5" title={video.title}>
                          {video.title}
                        </p>
                        {video.channelTitle && <p className="text-caption mb-2">{video.channelTitle}</p>}
                        <Button
                          size="sm"
                          variant={added ? "secondary" : "primary"}
                          className="w-full"
                          disabled={added || addingVideoId === video.youtubeVideoId}
                          onClick={() => handleAdd(video)}
                        >
                          {addingVideoId === video.youtubeVideoId ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : added ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          {added ? "Added to Learnings" : "Add to Learnings"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="text-caption text-ink-muted text-center mt-6 flex items-center justify-center gap-1">
        <ExternalLink className="size-3" /> Suggested videos are powered by YouTube search.
      </p>
    </div>
  );
}
