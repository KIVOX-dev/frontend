"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useUiStore } from "@/stores/uiStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { JobRoleRoadmap } from "@/components/learner/JobRoleRoadmap";
import { cn } from "@/lib/utils";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#FF0000" aria-hidden="true">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.5v-7l6.3 3.5-6.3 3.5Z" />
    </svg>
  );
}

const STEPS = [
  { title: "1. Copy the video or playlist link", body: "Open the YouTube video or playlist you want to convert and copy its link from the browser's address bar or the Share button." },
  { title: "2. Paste it and convert", body: "Paste the link above and press Convert — it becomes a course with a video player, lesson list, notes, and an assessment for each video." },
  { title: "3. Start your Learnings", body: "Find it any time under Learnings, pick up where you left off, and mark lessons complete as you go." },
];

/**
 * Tools > YouTube to Course — paste a video/playlist URL, POST /courses/import
 * turns it into a trackable course (see course.service.js). On success,
 * routes to the Learnings list where the new course now appears (see
 * MyLearnings.tsx) rather than trying to deep-link straight into the viewer.
 */
export function YoutubeCourseImport() {
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"link" | "roadmap">("link");
  const [targetJobRole, setTargetJobRole] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ target_job_role?: string | null }>("/students/profile")
      .then((res) => setTargetJobRole(res.data.target_job_role ?? null))
      .catch(() => setTargetJobRole(null));
  }, []);

  const handleConvert = async () => {
    if (!url.trim()) return;
    setImporting(true);
    setError("");
    try {
      await api.post("/courses/import", { url: url.trim() });
      setActiveScreen("learnings");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't convert that link"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-heading-l mb-1">YouTube to Course</h1>
        <p className="text-body text-ink-muted">Convert a link, or follow a video roadmap for your chosen job role.</p>
      </div>

      <div className="flex justify-center gap-1 mb-8 border-b border-line">
        {(["link", "roadmap"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={cn(
              "px-4 py-2.5 text-small font-semibold border-b-2 -mb-px transition-colors",
              mode === tab ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {tab === "link" ? "Paste a Link" : "Job Role Roadmap"}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <>
          <Card className="max-w-xl mx-auto text-center py-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <YoutubeIcon className="size-7" />
              <h2 className="text-section-title">Convert YouTube Playlist</h2>
            </div>
            <p className="text-small mb-6">Paste your YouTube video or playlist URL and convert it into a course.</p>

            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the content/playlist link here"
              className="mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleConvert()}
            />
            {error && <p className="text-small text-danger mt-2 mb-2">{error}</p>}

            <p className="text-caption my-3">Powered by YouTube</p>
            <Button onClick={handleConvert} loading={importing} disabled={!url.trim()}>
              Convert →
            </Button>
          </Card>

          <div className="mt-12">
            <h3 className="text-section-title text-center mb-6">How to convert a YouTube link to a course?</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <Card key={step.title}>
                  <p className="font-semibold text-ink mb-1">{step.title}</p>
                  <p className="text-small">{step.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <JobRoleRoadmap targetJobRole={targetJobRole} />
      )}
    </div>
  );
}
