"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Globe, Camera, Monitor } from "lucide-react";
import { FilesetResolver, ObjectDetector, type ObjectDetectorResult } from "@mediapipe/tasks-vision";
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

// Same CDN/model-store pattern as LearnerMockInterview.tsx's posture
// detection (already allow-listed in next.config.mjs's CSP) — a second,
// unrelated MediaPipe Tasks Vision model, this time EfficientDet-Lite0 for
// general object detection instead of PoseLandmarker.
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const OBJECT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";
// A conservative subset of the model's 80 COCO classes — deliberately
// excludes "keyboard"/"mouse"/"book" etc., which the camera routinely sees
// as part of the student's OWN normal setup and would false-positive
// constantly. These four are the classic "second device" cheating signals.
const DEVICE_CLASSES = new Set(["cell phone", "laptop", "tv", "remote"]);
// Must persist this long before it ends the assessment — a single misread
// frame shouldn't terminate someone's attempt, but this is deliberately much
// shorter than posture detection's debounce elsewhere in the app, since the
// whole point here is stopping quickly once something real is confirmed.
const DEVICE_DETECTION_DEBOUNCE_MS = 600;

function detectsExternalDevice(result: ObjectDetectorResult): boolean {
  return result.detections.some((d) => d.categories.some((c) => DEVICE_CLASSES.has(c.categoryName) && c.score > 0.5));
}

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
  const violationsRef = useRef({ tab_switches: 0, copy_paste: 0, screen_share_stopped: 0, device_detected: 0 });

  const [answers, setAnswers] = useState<(string | null)[]>([]);
  // handleSubmit is called from two long-lived closures (the countdown timer
  // and the device-detection loop below) that only get recreated when
  // `stage` changes — without this ref, both would submit whatever `answers`
  // looked like at the moment the quiz started (all null), not the student's
  // actual selections, since a closure captured once doesn't see later state
  // updates. submittingRef guards the same way against a double-submit if
  // both triggers fire close together (e.g. timer expires right as a device
  // is spotted).
  const answersRef = useRef<(string | null)[]>([]);
  const submittingRef = useRef(false);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [graded, setGraded] = useState<GradedQuestion[] | null>(null);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [terminationReason, setTerminationReason] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const [objectDetectorReady, setObjectDetectorReady] = useState(false);
  const lastDetectTimestampRef = useRef(0);
  const deviceIssueSinceRef = useRef<number | null>(null);
  const detectLoopRef = useRef<number | null>(null);

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
      // Whichever surface the browser's own native picker returns is
      // accepted — `displaySurface` support (and what a given OS labels
      // "Entire Screen" internally) is inconsistent enough across browsers
      // that hard-rejecting anything but "monitor" was blocking genuine
      // full-screen shares. The share itself (native "you're sharing"
      // indicator, flagged in violations if it ends early) is what matters,
      // not which specific surface was chosen.
      const surface = (track.getSettings() as MediaTrackSettings & { displaySurface?: string }).displaySurface;
      track.onended = () => {
        violationsRef.current.screen_share_stopped += 1;
        setScreenStatus("denied");
        setScreenError("Screen sharing stopped — share your screen again to continue.");
      };
      screenStreamRef.current = stream;
      setScreenStatus("granted");
      setScreenError(surface && surface !== "monitor" ? 'Sharing a window/tab — prefer "Entire Screen" if you can.' : "");
    } catch {
      setScreenStatus("denied");
      setScreenError("Screen sharing was cancelled or denied.");
    }
  };

  const readyToStart = cameraStatus === "granted" && screenStatus === "granted" && agreed;

  const handleSubmit = async () => {
    if (!questions || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.post<{ attempt: AssessmentAttempt; graded: GradedQuestion[] }>(
        `/courses/${courseId}/lessons/${lessonId}/assessment/submit`,
        { answers: answersRef.current, violations: violationsRef.current }
      );
      setGraded(res.data.graded);
      setResult(res.data.attempt);
      setStage("done");
      stopStreams();
    } catch (err: unknown) {
      setSubmitError(extractErrorMessage(err, "Couldn't submit the assessment"));
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = () => {
    if (!readyToStart || !questions) return;
    setSecondsLeft(questions.length * SECONDS_PER_QUESTION);
    setCurrentIndex(0);
    setStage("quiz");
  };

  // Loads the object-detection model once, up front — same
  // load-once-on-mount shape as LearnerMockInterview.tsx's posture model.
  // Degrades gracefully: if this fails (blocked CDN, offline, etc.) the
  // assessment still proceeds without device detection rather than blocking
  // on it, same philosophy as posture detection elsewhere in the app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const detector = await ObjectDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: OBJECT_MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          scoreThreshold: 0.5,
          maxResults: 5,
        });
        if (cancelled) {
          detector.close();
          return;
        }
        objectDetectorRef.current = detector;
        setObjectDetectorReady(true);
      } catch (err) {
        console.error("Failed to load device-detection model:", err);
      }
    })();
    return () => {
      cancelled = true;
      objectDetectorRef.current?.close();
      objectDetectorRef.current = null;
    };
  }, []);

  // The camera preview <video> only mounts once `stage` is "quiz" (see the
  // render below) — same reattachment-on-mount fix as LearnerMockInterview.tsx.
  useEffect(() => {
    if (stage === "quiz" && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  // Runs a requestAnimationFrame object-detection loop for as long as the
  // quiz is showing and the model is ready — spotting a phone/laptop/tv/
  // remote in frame ends the assessment immediately (submits whatever was
  // answered so far, flagged via violations.device_detected).
  useEffect(() => {
    if (stage !== "quiz" || !objectDetectorReady) return;

    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    const detect = () => {
      try {
        const video = videoRef.current;
        const detector = objectDetectorRef.current;
        if (video && detector && video.readyState >= 2) {
          // Strictly increasing timestamp requirement — same reasoning as
          // LearnerMockInterview.tsx's lastPoseTimestampRef.
          const timestamp = Math.max(performance.now(), lastDetectTimestampRef.current + 1);
          lastDetectTimestampRef.current = timestamp;
          const result = detector.detectForVideo(video, timestamp);
          consecutiveErrors = 0;
          const now = Date.now();
          if (detectsExternalDevice(result)) {
            if (deviceIssueSinceRef.current == null) deviceIssueSinceRef.current = now;
            if (now - deviceIssueSinceRef.current > DEVICE_DETECTION_DEBOUNCE_MS) {
              violationsRef.current.device_detected += 1;
              setTerminationReason("An external device (phone, laptop, TV, or remote) was detected in your camera — the assessment was stopped immediately.");
              handleSubmit();
              return;
            }
          } else {
            deviceIssueSinceRef.current = null;
          }
        }
      } catch (err) {
        console.error("Device detection frame failed:", err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return;
      }
      detectLoopRef.current = requestAnimationFrame(detect);
    };
    detectLoopRef.current = requestAnimationFrame(detect);

    return () => {
      if (detectLoopRef.current) cancelAnimationFrame(detectLoopRef.current);
      deviceIssueSinceRef.current = null;
    };
    // handleSubmit intentionally not a dependency — see the comment on
    // answersRef/submittingRef above for why it's safe here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, objectDetectorReady]);

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

  // The app shell sets `body { overflow: hidden }` globally and relies on
  // its own #content div for scrolling (see legacy-portal.css) — this
  // window renders with no shell at all (see the module doc comment above),
  // so without its own explicit scroll container here, anything taller than
  // the viewport (a long question list, a short window) was just clipped
  // with no way to reach it.
  const scrollRootClass = "min-h-screen overflow-y-auto";

  if (loadError) {
    return (
      <div className={cn(scrollRootClass, "p-10 max-w-2xl mx-auto text-center")}>
        <p className="text-small text-danger">{loadError}</p>
      </div>
    );
  }
  if (stage === "loading" || !questions) {
    return (
      <div className={cn(scrollRootClass, "p-10 max-w-2xl mx-auto text-center")}>
        <p className="text-small">Loading assessment…</p>
      </div>
    );
  }

  if (stage === "gate") {
    const durationMinutes = Math.round((questions.length * SECONDS_PER_QUESTION) / 60);
    const passMarks = Math.ceil(questions.length * 0.6);

    return (
      <div className={cn(scrollRootClass, "max-w-5xl mx-auto p-6 md:p-10")}>
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
                  detail={screenStatus === "granted" ? screenError || "Screen sharing active" : screenError}
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

  // stage === "quiz" | "done" — one question at a time, with a Question
  // Palette to jump around (matches the reference layout, and incidentally
  // sidesteps the earlier scroll issue too: nothing here is ever taller
  // than the viewport since only one question renders at once).
  const displayGraded = graded;
  const currentQuestion = questions[currentIndex];
  const currentGraded = displayGraded?.[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className={cn(scrollRootClass, "max-w-5xl mx-auto p-6 md:p-10")}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-caption mb-1">{lessonTitle}</p>
          <h1 className="text-heading-l">Assessment</h1>
        </div>
        {stage === "quiz" && <div className="text-section-title tabular-nums">{formatClock(secondsLeft)}</div>}
      </div>

      {terminationReason && (
        <p className="text-small text-danger font-semibold mb-4 rounded-md border border-danger/30 bg-[color-mix(in_srgb,var(--color-danger)_6%,white)] p-3">
          {terminationReason}
        </p>
      )}

      {result && (
        <p className="text-small font-semibold text-ink mb-5">
          Score: {result.score}/{result.max_score} ({result.percentage}%)
        </p>
      )}

      {stage === "quiz" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="fixed bottom-4 right-4 w-36 aspect-video rounded-md border border-line shadow-dropdown object-cover bg-black z-50"
        />
      )}

      <div className="grid lg:grid-cols-[1fr_260px] gap-6 items-start">
        <Card>
          <p className="text-caption mb-1">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-section-title mb-5">{currentQuestion.question}</p>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = answers[currentIndex] === option;
              const showCorrectness = !!currentGraded;
              const isCorrectOption = currentGraded?.correct_answer === option;
              return (
                <label
                  key={option}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-3 text-small cursor-pointer transition-colors duration-150",
                    showCorrectness && isCorrectOption ? "border-success bg-[color-mix(in_srgb,var(--color-success)_8%,white)]" : "",
                    showCorrectness && isSelected && !isCorrectOption ? "border-danger bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]" : "",
                    !showCorrectness && isSelected ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]" : "",
                    !showCorrectness && !isSelected ? "border-line hover:border-line-strong" : ""
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${currentIndex}`}
                    checked={isSelected}
                    disabled={!!displayGraded}
                    className="sr-only"
                    onChange={() => setAnswers((prev) => prev.map((a, idx) => (idx === currentIndex ? option : a)))}
                  />
                  <span
                    className={cn(
                      "flex items-center justify-center size-7 shrink-0 rounded-full text-caption font-semibold",
                      showCorrectness && isCorrectOption ? "bg-success text-white" : "",
                      showCorrectness && isSelected && !isCorrectOption ? "bg-danger text-white" : "",
                      !showCorrectness && isSelected ? "bg-primary text-white" : "",
                      !showCorrectness && !isSelected ? "bg-paper-tint text-ink-muted" : ""
                    )}
                  >
                    {letter}
                  </span>
                  {option}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
              ← Previous
            </Button>
            {stage === "quiz" && !isLastQuestion && (
              <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>Next →</Button>
            )}
            {stage === "quiz" && isLastQuestion && (
              <Button onClick={handleSubmit} loading={submitting} disabled={answers.some((a) => !a)}>
                Submit Assessment
              </Button>
            )}
            {stage === "done" && !isLastQuestion && (
              <Button variant="secondary" onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next →
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <p className="font-semibold text-ink mb-3">Question Palette</p>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {questions.map((_, i) => {
              const answered = !!answers[i];
              const gq = displayGraded?.[i];
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "size-9 rounded-md text-small font-medium border transition-colors duration-150",
                    i === currentIndex ? "border-primary border-2" : "border-line",
                    gq ? (gq.is_correct ? "bg-[color-mix(in_srgb,var(--color-success)_15%,white)] text-success" : "bg-[color-mix(in_srgb,var(--color-danger)_15%,white)] text-danger") : "",
                    !gq && answered ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-primary" : "",
                    !gq && !answered ? "bg-white text-ink-muted" : ""
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 text-caption">
            <LegendDot className="bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] border-primary/30" label={displayGraded ? "Correct" : "Answered"} />
            <LegendDot className="bg-white border-line" label={displayGraded ? "Incorrect" : "Not answered"} />
          </div>
        </Card>
      </div>

      {submitError && <p className="text-small text-danger mt-4">{submitError}</p>}
      {stage === "done" && (
        <div className="flex items-center gap-3 mt-5">
          <Button variant="secondary" onClick={() => (window.location.href = "/learner")}>
            ← Back to Dashboard
          </Button>
          <p className="text-small">You can also just close this window.</p>
        </div>
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3.5 rounded border", className)} />
      {label}
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
