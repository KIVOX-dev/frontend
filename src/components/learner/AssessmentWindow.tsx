"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Globe, Camera, Monitor } from "lucide-react";
import { SkillBadgeIcon } from "@/components/shared/SkillBadgeIcon";
import { FilesetResolver, ObjectDetector, PoseLandmarker, type ObjectDetectorResult, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AssessmentQuestion = { question: string; options: string[] };
type GradedQuestion = AssessmentQuestion & { correct_answer: string; selected: string | null; is_correct: boolean };
type AssessmentAttempt = { score: number; max_score: number; percentage: number };
type CheckStatus = "idle" | "checking" | "granted" | "denied";
type SkillProgress = { skill_name: string; badge_count: number; certificate_issued: boolean; badges_remaining: number };
const BADGES_PER_CERTIFICATE = 5;

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

// Same pose-landmarker model/CDN as LearnerMockInterview.tsx's posture
// detection — reused here for a different purpose: not posture, but "is
// there exactly one person, framed from the face down to the chest, facing
// the camera." `numPoses: 3` is enough headroom to tell "0", "1", and
// "more than 1" apart without needing a large cap.
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const POSE_LANDMARK = { NOSE: 0, LEFT_EYE: 2, RIGHT_EYE: 5, LEFT_EAR: 7, RIGHT_EAR: 8, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12 } as const;
// MediaPipe Pose reports a per-landmark `visibility` score (0-1, how
// confident it is that point is actually in frame / not occluded) — real
// model output, not a guessed heuristic.
const LANDMARK_VISIBILITY_THRESHOLD = 0.5;
// Sustained this long before counting as one strike — much more forgiving
// than device detection's debounce, since normal movement (glancing at
// notes, adjusting in the chair) briefly trips these checks constantly and
// shouldn't itself be treated as an offense.
const FRAMING_WARNING_DEBOUNCE_MS = 2000;

// Returns a human-readable reason once one of "exactly one person" / "facing
// the camera" / "framed down to the chest" is violated, or null if framing
// is fine. All three collapse into a single shared 2-strike counter (see the
// detection loop below) rather than being tracked separately.
function evaluateFraming(result: PoseLandmarkerResult): string | null {
  const count = result.landmarks.length;
  if (count === 0) return "No one is visible in the camera — face the camera to continue.";
  if (count > 1) return "More than one person is visible in the camera.";

  const lm = result.landmarks[0];
  const visibility = (i: number) => lm[i]?.visibility ?? 0;

  if (visibility(POSE_LANDMARK.NOSE) < LANDMARK_VISIBILITY_THRESHOLD) {
    return "Your face isn't clearly visible — face the camera.";
  }
  if (visibility(POSE_LANDMARK.LEFT_SHOULDER) < LANDMARK_VISIBILITY_THRESHOLD || visibility(POSE_LANDMARK.RIGHT_SHOULDER) < LANDMARK_VISIBILITY_THRESHOLD) {
    return "Move back so the camera can see your face and chest.";
  }
  const leftSideVisible = visibility(POSE_LANDMARK.LEFT_EYE) > LANDMARK_VISIBILITY_THRESHOLD && visibility(POSE_LANDMARK.LEFT_EAR) > LANDMARK_VISIBILITY_THRESHOLD;
  const rightSideVisible = visibility(POSE_LANDMARK.RIGHT_EYE) > LANDMARK_VISIBILITY_THRESHOLD && visibility(POSE_LANDMARK.RIGHT_EAR) > LANDMARK_VISIBILITY_THRESHOLD;
  if (!leftSideVisible || !rightSideVisible) {
    return "Face the camera directly — don't turn your head to the side.";
  }
  return null;
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
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [skillProgress, setSkillProgress] = useState<SkillProgress | null>(null);
  const [loadError, setLoadError] = useState("");
  const [stage, setStage] = useState<"loading" | "gate" | "quiz" | "done">("loading");

  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("idle");
  const [cameraError, setCameraError] = useState("");
  const [screenStatus, setScreenStatus] = useState<CheckStatus>("idle");
  const [screenError, setScreenError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const violationsRef = useRef({ tab_switches: 0, copy_paste: 0, screen_share_stopped: 0, device_detected: 0, framing_warnings: 0 });

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
  // Both loading effects and the detection loop below degrade silently by
  // design (console.error only, assessment still proceeds without that
  // check) — this makes that failure visible instead, since a silent
  // failure here is indistinguishable from "nothing to report" otherwise.
  const [proctoringIssue, setProctoringIssue] = useState<string | null>(null);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const [poseModelReady, setPoseModelReady] = useState(false);
  const lastPoseTimestampRef = useRef(0);
  // "Active" tracks whether we're currently inside one sustained violation
  // (so it's only counted as a fresh strike once, not once per frame while
  // it persists) — cleared once framing is fine again, so the NEXT separate
  // occurrence still counts as strike two rather than being swallowed.
  const framingIssueSinceRef = useRef<number | null>(null);
  const framingIssueActiveRef = useRef(false);
  const [framingWarning, setFramingWarning] = useState<{ message: string; count: number } | null>(null);

  useEffect(() => {
    if (!courseId || !lessonId) {
      setLoadError("This window is missing its course/lesson — open it from a lesson's Assessment tab.");
      return;
    }
    Promise.all([
      api.get<{ title: string; lessons: { id: string; title: string }[] }>(`/courses/${courseId}`),
      api.get<{ questions: AssessmentQuestion[]; duration_seconds: number; skill_progress: SkillProgress | null }>(
        `/courses/${courseId}/lessons/${lessonId}/assessment`
      ),
    ])
      .then(([courseRes, assessmentRes]) => {
        const lesson = courseRes.data.lessons.find((l) => l.id === lessonId);
        setLessonTitle(lesson?.title || courseRes.data.title);
        setQuestions(assessmentRes.data.questions);
        setDurationSeconds(assessmentRes.data.duration_seconds);
        setSkillProgress(assessmentRes.data.skill_progress);
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
    setSecondsLeft(durationSeconds);
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
        if (!cancelled) setProctoringIssue(`Device-detection model failed to load: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
    return () => {
      cancelled = true;
      objectDetectorRef.current?.close();
      objectDetectorRef.current = null;
    };
  }, []);

  // Loads the pose-landmarker model used for the "one person, facing the
  // camera, framed to the chest" checks — same load-once, degrade-gracefully
  // shape as the object detector above. If this fails to load, that specific
  // check just never runs (device detection is independent and unaffected).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numPoses: 3,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        poseLandmarkerRef.current = landmarker;
        setPoseModelReady(true);
      } catch (err) {
        console.error("Failed to load framing-detection model:", err);
        if (!cancelled) setProctoringIssue(`Framing-detection model failed to load: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
    return () => {
      cancelled = true;
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
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

  // One requestAnimationFrame loop running both checks per frame (cheaper
  // than two competing RAF loops fighting over the same video element):
  //
  // 1. Device detection — zero tolerance. A phone/laptop/tv/remote in frame
  //    ends the assessment immediately, no warning (violations.device_detected,
  //    marked 'malpractice' server-side, permanently blocks retaking).
  //
  // 2. Framing — "exactly one person, facing the camera, visible down to the
  //    chest." Two-strike: the first sustained violation shows a warning
  //    banner (self-correctable, doesn't stop anything); a second SEPARATE
  //    occurrence ends the assessment (violations.framing_warnings) — but
  //    unlike device detection, this does NOT permanently block retaking,
  //    since a bad webcam angle or briefly stepping out of frame twice is
  //    plausibly innocent in a way a phone appearing in frame just isn't.
  useEffect(() => {
    if (stage !== "quiz" || (!objectDetectorReady && !poseModelReady)) return;

    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    const detect = () => {
      try {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const objectDetector = objectDetectorRef.current;
          if (objectDetector) {
            // Strictly increasing timestamp requirement — same reasoning as
            // LearnerMockInterview.tsx's lastPoseTimestampRef.
            const timestamp = Math.max(performance.now(), lastDetectTimestampRef.current + 1);
            lastDetectTimestampRef.current = timestamp;
            const result = objectDetector.detectForVideo(video, timestamp);
            if (detectsExternalDevice(result)) {
              const now = Date.now();
              if (deviceIssueSinceRef.current == null) deviceIssueSinceRef.current = now;
              if (now - deviceIssueSinceRef.current > DEVICE_DETECTION_DEBOUNCE_MS) {
                violationsRef.current.device_detected += 1;
                setTerminationReason(
                  "An external device (phone, laptop, TV, or remote) was detected in your camera — the assessment was stopped immediately."
                );
                handleSubmit();
                return;
              }
            } else {
              deviceIssueSinceRef.current = null;
            }
          }

          const poseLandmarker = poseLandmarkerRef.current;
          if (poseLandmarker) {
            const timestamp = Math.max(performance.now(), lastPoseTimestampRef.current + 1);
            lastPoseTimestampRef.current = timestamp;
            const poseResult = poseLandmarker.detectForVideo(video, timestamp);
            const issue = evaluateFraming(poseResult);
            const now = Date.now();
            if (issue) {
              if (framingIssueSinceRef.current == null) framingIssueSinceRef.current = now;
              if (!framingIssueActiveRef.current && now - framingIssueSinceRef.current > FRAMING_WARNING_DEBOUNCE_MS) {
                framingIssueActiveRef.current = true;
                violationsRef.current.framing_warnings += 1;
                const count = violationsRef.current.framing_warnings;
                if (count >= 2) {
                  setTerminationReason(`${issue} This is your second warning — the assessment has ended.`);
                  handleSubmit();
                  return;
                }
                setFramingWarning({ message: issue, count });
              } else if (framingIssueActiveRef.current) {
                setFramingWarning({ message: issue, count: violationsRef.current.framing_warnings });
              }
            } else {
              framingIssueSinceRef.current = null;
              framingIssueActiveRef.current = false;
              setFramingWarning(null);
            }
          }
        }
        consecutiveErrors = 0;
      } catch (err) {
        console.error("Proctoring detection frame failed:", err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          setProctoringIssue(`Proctoring checks stopped after repeated errors: ${err instanceof Error ? err.message : String(err)}`);
          return;
        }
      }
      detectLoopRef.current = requestAnimationFrame(detect);
    };
    detectLoopRef.current = requestAnimationFrame(detect);

    return () => {
      if (detectLoopRef.current) cancelAnimationFrame(detectLoopRef.current);
      deviceIssueSinceRef.current = null;
      framingIssueSinceRef.current = null;
      framingIssueActiveRef.current = false;
      setFramingWarning(null);
    };
    // handleSubmit intentionally not a dependency — see the comment on
    // answersRef/submittingRef above for why it's safe here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, objectDetectorReady, poseModelReady]);

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
    const durationMinutes = Math.round(durationSeconds / 60);
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
              <li>Stay alone, facing the camera, visible from your face to your chest — you&apos;ll get one warning, then the assessment ends.</li>
              <li>External devices (phone, laptop, TV, remote) are not permitted — this ends the assessment immediately, no warning.</li>
            </ol>
            <p className="text-caption bg-paper-tint rounded-md p-3">
              Note: Camera, microphone and screen sharing stay on for the duration of the assessment — nothing is recorded or uploaded, but tab
              switches, copy/paste attempts, and framing warnings are counted and saved with your result.
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

            {skillProgress && (
              <div className="flex items-center gap-3 rounded-md border border-line p-3 mb-4">
                <SkillBadgeIcon size={32} className="shrink-0" />
                <p className="text-small">
                  {skillProgress.certificate_issued ? (
                    <>
                      Passing this counts toward your already-certified <span className="font-semibold text-ink">{skillProgress.skill_name}</span>{" "}
                      badge.
                    </>
                  ) : (
                    <>
                      Passing this earns a badge toward <span className="font-semibold text-ink">{skillProgress.skill_name}</span> — currently{" "}
                      {skillProgress.badge_count}/{BADGES_PER_CERTIFICATE}. {BADGES_PER_CERTIFICATE} distinct lessons passed earns a real,
                      LinkedIn-addable certificate.
                    </>
                  )}
                </p>
              </div>
            )}

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

      {stage === "quiz" && framingWarning && (
        <p className="text-small font-semibold mb-4 rounded-md border p-3 text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,white)] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)]">
          Warning {framingWarning.count}/2: {framingWarning.message} One more and the assessment will end.
        </p>
      )}

      {stage === "quiz" && proctoringIssue && (
        <p className="text-small text-ink-muted mb-4 rounded-md border border-line bg-paper-tint p-3">{proctoringIssue}</p>
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
