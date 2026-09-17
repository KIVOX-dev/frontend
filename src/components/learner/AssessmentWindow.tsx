"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Globe, Camera, Monitor } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AssessmentQuestion = { question: string; options: string[] };
type GradedQuestion = AssessmentQuestion & { correct_answer: string; selected: string | null; is_correct: boolean };
type AssessmentAttempt = { score: number; max_score: number; percentage: number };
type CheckStatus = "idle" | "checking" | "granted" | "denied";

// 2 minutes/question — roughly matches the reference's ~100s/question pace
// (15 questions / 25 minutes) for our own 10-question lesson quizzes.
const SECONDS_PER_QUESTION = 120;

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Opened in its own browser window/tab (see CourseViewer.tsx's Assessment
 * tab, which does `window.open` instead of rendering this inline) — a
 * genuinely separate window is what makes "did they switch away from the
 * assessment" a meaningful signal at all, and keeps the proctoring checks
 * isolated from the course video/notes UI. Reads courseId/lessonId from its
 * own URL rather than props, since a fresh window has no React state from
 * wherever it was opened.
 *
 * Camera/mic and screen-share are real getUserMedia/getDisplayMedia grants,
 * kept live (shown by the browser's own "sharing" indicator) for the
 * duration of the quiz — not recorded or uploaded anywhere. "Integrity
 * signals" below means client-reported counts (tab switches, copy/paste,
 * the screen share ending early), sent alongside the answers and stored on
 * the attempt — a soft signal for the student's own review, not a verified
 * recording. See lessonAssessmentAttempt.model.js's comment on this same
 * tradeoff on the backend.
 */
export function AssessmentWindow() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const lessonId = searchParams.get("lessonId") || "";

  const [lessonTitle, setLessonTitle] = useState("");
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [stage, setStage] = useState<"loading" | "gate" | "quiz" | "done">("loading");

  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("idle");
  const [cameraError, setCameraError] = useState("");
  const [screenStatus, setScreenStatus] = useState<CheckStatus>("idle");
  const [screenError, setScreenError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const violationsRef = useRef({ tab_switches: 0, copy_paste: 0, screen_share_stopped: 0 });

  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [graded, setGraded] = useState<GradedQuestion[] | null>(null);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!courseId || !lessonId) {
      setLoadError("This window is missing its course/lesson — open it from a lesson's Assessment tab.");
      return;
    }
    Promise.all([
      api.get<{ title: string; lessons: { id: string; title: string }[] }>(`/courses/${courseId}`),
      api.get<{ questions: AssessmentQuestion[] }>(`/courses/${courseId}/lessons/${lessonId}/assessment`),
    ])
      .then(([courseRes, assessmentRes]) => {
        const lesson = courseRes.data.lessons.find((l) => l.id === lessonId);
        setLessonTitle(lesson?.title || courseRes.data.title);
        setQuestions(assessmentRes.data.questions);
        setAnswers(new Array(assessmentRes.data.questions.length).fill(null));
        setStage("gate");
      })
      .catch((err: unknown) => setLoadError(extractErrorMessage(err, "Couldn't load the assessment")));
  }, [courseId, lessonId]);

  const stopStreams = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
  };

  useEffect(() => stopStreams, []);

  const checkCamera = async () => {
    setCameraStatus("checking");
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      setCameraStatus("granted");
    } catch {
      setCameraStatus("denied");
      setCameraError("No camera or microphone was found on this device.");
    }
  };

  const checkScreen = async () => {
    setScreenStatus("checking");
    setScreenError("");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const surface = (track.getSettings() as MediaTrackSettings & { displaySurface?: string }).displaySurface;
      if (surface && surface !== "monitor") {
        stream.getTracks().forEach((t) => t.stop());
        setScreenStatus("denied");
        setScreenError('Share your "Entire Screen," not a window or tab.');
        return;
      }
      track.onended = () => {
        violationsRef.current.screen_share_stopped += 1;
        setScreenStatus("denied");
        setScreenError("Screen sharing stopped — share your screen again to continue.");
      };
      screenStreamRef.current = stream;
      setScreenStatus("granted");
    } catch {
      setScreenStatus("denied");
      setScreenError("Screen sharing was cancelled or denied.");
    }
  };

  const readyToStart = cameraStatus === "granted" && screenStatus === "granted" && agreed;

  const handleSubmit = async () => {
    if (!questions || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.post<{ attempt: AssessmentAttempt; graded: GradedQuestion[] }>(
        `/courses/${courseId}/lessons/${lessonId}/assessment/submit`,
        { answers, violations: violationsRef.current }
      );
      setGraded(res.data.graded);
      setResult(res.data.attempt);
      setStage("done");
      stopStreams();
    } catch (err: unknown) {
      setSubmitError(extractErrorMessage(err, "Couldn't submit the assessment"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = () => {
    if (!readyToStart || !questions) return;
    setSecondsLeft(questions.length * SECONDS_PER_QUESTION);
    setStage("quiz");
  };

  // Countdown + auto-submit at zero.
  useEffect(() => {
    if (stage !== "quiz") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // handleSubmit is intentionally not a dependency — it would recreate the
    // interval every render; the ref-backed values it reads are always current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Integrity signals — self-reported counts, not a recording. See the
  // module doc comment above.
  useEffect(() => {
    if (stage !== "quiz") return;
    const onVisibility = () => {
      if (document.hidden) violationsRef.current.tab_switches += 1;
    };
    const onClipboardEvent = (e: ClipboardEvent) => {
      e.preventDefault();
      violationsRef.current.copy_paste += 1;
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", onClipboardEvent);
    document.addEventListener("paste", onClipboardEvent);
    document.addEventListener("cut", onClipboardEvent);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", onClipboardEvent);
      document.removeEventListener("paste", onClipboardEvent);
      document.removeEventListener("cut", onClipboardEvent);
    };
  }, [stage]);

  if (loadError) {
    return (
      <div className="p-10 max-w-2xl mx-auto text-center">
        <p className="text-small text-danger">{loadError}</p>
      </div>
    );
  }
  if (stage === "loading" || !questions) {
    return (
      <div className="p-10 max-w-2xl mx-auto text-center">
        <p className="text-small">Loading assessment…</p>
      </div>
    );
  }

  if (stage === "gate") {
    const durationMinutes = Math.round((questions.length * SECONDS_PER_QUESTION) / 60);
    const passMarks = Math.ceil(questions.length * 0.6);

    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="mb-6">
          <p className="text-caption mb-1">{lessonTitle}</p>
          <h1 className="text-heading-l">Assessment</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-section-title mb-1">Environment Check &amp; Instructions</h2>
            <p className="text-small mb-5">Before you begin, please make sure the following requirements are met to ensure a smooth testing experience.</p>

            <div className="space-y-3 mb-5">
              <CheckRow icon={Globe} label="Internet" status="granted" detail="Connected" />

              <div>
                <CheckRow
                  icon={Camera}
                  label="Camera &amp; Microphone"
                  status={cameraStatus === "idle" || cameraStatus === "checking" ? "idle" : cameraStatus}
                  detail={cameraStatus === "granted" ? "Camera and microphone ready" : cameraError}
                />
                {cameraStatus !== "granted" && (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={checkCamera} loading={cameraStatus === "checking"}>
                    {cameraStatus === "denied" ? "Retry Camera Check" : "Check Camera & Microphone"}
                  </Button>
                )}
              </div>

              <div>
                <CheckRow
                  icon={Monitor}
                  label="Screen Recording"
                  status={screenStatus === "idle" || screenStatus === "checking" ? "idle" : screenStatus}
                  detail={screenStatus === "granted" ? "Entire screen selected" : screenError}
                />
                {screenStatus !== "granted" && (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={checkScreen} loading={screenStatus === "checking"}>
                    {screenStatus === "denied" ? "Retry Screen Share" : "Share Your Screen"}
                  </Button>
                )}
              </div>
            </div>

            <p className="font-semibold text-ink mb-2">Assessment Rules</p>
            <ol className="text-small space-y-1.5 list-decimal list-inside mb-4">
              <li>No tab switching or opening other applications during the assessment.</li>
              <li>Copy, pasting, or screen capture is disabled during the assessment.</li>
              <li>External devices or AI-based assistance are not permitted.</li>
            </ol>
            <p className="text-caption bg-paper-tint rounded-md p-3">
              Note: Camera, microphone and screen sharing stay on for the duration of the assessment — nothing is recorded or uploaded, but tab
              switches and copy/paste attempts are counted and saved with your result.
            </p>
          </div>

          <div>
            <Card className="mb-4">
              <h2 className="text-section-title mb-4">Assessment Overview</h2>
              <div className="space-y-2.5 text-small">
                <OverviewRow label="Assessment Format" value="Knowledge" />
                <OverviewRow label="Total Questions" value={`${questions.length} Questions`} />
                <OverviewRow label="Duration" value={`${durationMinutes} Minutes`} />
                <OverviewRow label="Total Marks" value={`${questions.length} Marks`} />
                <OverviewRow label="Pass Marks" value={`60% (${passMarks} Marks)`} valueClassName="text-success font-semibold" />
              </div>
            </Card>

            <label className="flex items-start gap-2 text-small mb-4 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              I understand and agree to the assessment rules and proctoring requirements.
            </label>

            <Button className="w-full justify-center" disabled={!readyToStart} onClick={handleStart}>
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // stage === "quiz" | "done"
  const displayGraded = graded;
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-caption mb-1">{lessonTitle}</p>
          <h1 className="text-heading-l">Assessment</h1>
        </div>
        {stage === "quiz" && <div className="text-section-title tabular-nums">{formatClock(secondsLeft)}</div>}
      </div>

      {result && (
        <p className="text-small font-semibold text-ink mb-5">
          Score: {result.score}/{result.max_score} ({result.percentage}%)
        </p>
      )}

      <div className="space-y-5">
        {questions.map((q, i) => {
          const gradedQ = displayGraded?.[i];
          return (
            <div key={i}>
              <p className="text-small font-semibold text-ink mb-2">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((option) => {
                  const isSelected = answers[i] === option;
                  const showCorrectness = !!gradedQ;
                  const isCorrectOption = gradedQ?.correct_answer === option;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2.5 text-small cursor-pointer",
                        showCorrectness && isCorrectOption ? "border-success bg-[color-mix(in_srgb,var(--color-success)_8%,white)]" : "",
                        showCorrectness && isSelected && !isCorrectOption ? "border-danger bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]" : "",
                        !showCorrectness ? "border-line hover:border-line-strong" : ""
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={isSelected}
                        disabled={!!displayGraded}
                        onChange={() => setAnswers((prev) => prev.map((a, idx) => (idx === i ? option : a)))}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {submitError && <p className="text-small text-danger mt-4">{submitError}</p>}

      {stage === "quiz" && (
        <Button className="mt-5" onClick={handleSubmit} loading={submitting} disabled={answers.some((a) => !a)}>
          Submit Assessment
        </Button>
      )}
      {stage === "done" && <p className="text-small mt-5">You can close this window now.</p>}
    </div>
  );
}

function CheckRow({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  status: "idle" | "granted" | "denied";
  detail?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border p-3",
        status === "granted" ? "border-success/30 bg-[color-mix(in_srgb,var(--color-success)_6%,white)]" : "",
        status === "denied" ? "border-danger/30 bg-[color-mix(in_srgb,var(--color-danger)_6%,white)]" : "",
        status === "idle" ? "border-line" : ""
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 text-ink-muted" />
        <div className="min-w-0">
          <p className="text-small font-medium text-ink">{label}</p>
          {detail && <p className="text-caption truncate">{detail}</p>}
        </div>
      </div>
      {status === "granted" && <CheckCircle2 className="size-5 shrink-0 text-success" />}
      {status === "denied" && <XCircle className="size-5 shrink-0 text-danger" />}
    </div>
  );
}

function OverviewRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}:</span>
      <span className={cn("font-medium text-ink", valueClassName)}>{value}</span>
    </div>
  );
}
