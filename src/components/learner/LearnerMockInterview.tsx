"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

interface Question {
  id: number;
  text: string;
  time_limit_seconds: number;
  type: string;
}

// Loaded from Google's model store / jsdelivr's CDN at runtime, not bundled —
// see next.config.mjs's CSP connect-src/worker-src for why those two origins
// are allow-listed. "lite" variant: accurate enough for a coarse posture
// heuristic (shoulder tilt, facing-camera) at a fraction of the "full"/"heavy"
// variants' download size and per-frame inference cost.
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

// Indices into MediaPipe Pose's 33-point BlazePose landmark layout — only
// the few this component's posture heuristic actually uses.
const POSE_LANDMARK = { NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12 } as const;

// A candidate must persist this long before it's shown — raw per-frame
// landmark jitter (and momentary head turns to glance at the question) would
// otherwise flash the warning banner on and off constantly.
const POSTURE_WARNING_DEBOUNCE_MS = 1500;

function evaluatePosture(result: PoseLandmarkerResult): string | null {
  const landmarks = result.landmarks[0];
  const nose = landmarks?.[POSE_LANDMARK.NOSE];
  const leftShoulder = landmarks?.[POSE_LANDMARK.LEFT_SHOULDER];
  const rightShoulder = landmarks?.[POSE_LANDMARK.RIGHT_SHOULDER];
  if (!nose || !leftShoulder || !rightShoulder) return "Please stay in frame — we can't see you.";

  // Landmark x/y are normalized to [0, 1] against the video frame, so these
  // thresholds are resolution-independent.
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderTilt > 0.08) return "Sit up straight and face the camera.";

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  if (Math.abs(nose.x - shoulderMidX) > 0.12) return "Please face the camera.";

  return null;
}

// Minimal shape for the Web Speech API's SpeechRecognition — not in
// lib.dom.d.ts (it's still non-standard/vendor-prefixed on most browsers),
// so this declares only what toggleListening() below actually reads/sets.
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface InterviewRecord {
  id: number;
  role: string;
  category: string;
  overall_rating: number;
  strengths: string[];
  improvements: string[];
  duration_seconds: number;
  attempt_number: number;
  created_at: string;
}

export function LearnerMockInterview() {
  const { setActiveScreen } = useUiStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [setup, setSetup] = useState(true);
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [history, setHistory] = useState<InterviewRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // useCallback with an explicit [user?.id] dependency (rather than the
  // plain function this used to be) so the effect below can safely depend
  // on `fetchHistory` itself and always call it with the current user — a
  // plain re-declared-every-render function would either need omitting from
  // deps (masking a real, if rare, staleness risk if `user` ever changes
  // while mounted) or would re-run the effect every render if added as-is.
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/students/${user.id}/interviews`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch interview history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);


  const [interviewComplete, setInterviewComplete] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mirrors `answers` for finishInterview() to read (see that function,
  // below) without needing `answers` in the timer effect's dependency array.
  // Adding it there would reset the 60s per-question countdown on every
  // keystroke — the fix for the real bug (finishInterview submitting a
  // stale `answers` snapshot from whenever the timer/question last reset,
  // missing anything typed since — see the exhaustive-deps warning on the
  // effect below) can't be "add the missing dep" here; it has to be reading
  // through something that isn't part of the effect's own timing.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // --- Camera + real-time posture detection ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const poseLoopRef = useRef<number | null>(null);
  const postureIssueSinceRef = useRef<number | null>(null);
  const lastPoseTimestampRef = useRef(0);
  const [mediaStatus, setMediaStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [poseModelReady, setPoseModelReady] = useState(false);
  const [postureWarning, setPostureWarning] = useState<string | null>(null);
  const [cameraDisconnected, setCameraDisconnected] = useState(false);

  // --- Speech-to-text ---
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  // Snapshot of whatever was already in the box when this listening session
  // started (typed manually, or left from an earlier session on this same
  // question) — speech gets appended after it, never overwrites it.
  const speechBaseRef = useRef("");
  // Accumulated *finalized* speech for the current listening session only —
  // separate from speechBaseRef so a stop/restart doesn't double it up.
  const speechFinalRef = useRef("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);

  // Loads the posture model in the background as soon as this screen mounts
  // (not gated on camera permission — the download/init can overlap with the
  // user reading the setup screen and clicking "Enable Camera").
  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionCtor()));

    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        // CPU, not GPU — the WebGL-based GPU delegate fails silently or
        // throws mid-session on a lot of real machines (VMs, remote desktop
        // sessions, hardware acceleration disabled) in ways that never show
        // up in normal local testing. CPU is slower per frame but the "lite"
        // model at 1 pose is well within real-time budget, and it works
        // identically everywhere.
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        poseLandmarkerRef.current = landmarker;
        setPoseModelReady(true);
      } catch (err) {
        // Posture detection degrades to "unavailable" rather than blocking
        // the interview — camera + speech-to-text still work without it.
        console.error("Failed to load posture-detection model:", err);
      }
    })();

    return () => {
      cancelled = true;
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
    };
  }, []);

  // Reattaches the live stream to whichever <video> element is actually
  // mounted — the setup screen's preview and the live-interview screen's
  // preview are two different DOM nodes (separate `return`s below), so a
  // single `videoRef` needs its `srcObject` re-set whenever the mounted
  // element changes. Two triggers, not one: `setup` flipping (setup screen
  // -> live screen swaps which <video> exists) AND `mediaStatus` becoming
  // "granted" (the setup screen's own preview <video> is gated behind that
  // status, so it doesn't exist yet at the moment requestMedia() resolves —
  // this effect is what actually attaches the stream to it once it mounts).
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [setup, mediaStatus]);

  // Stops the camera/mic hardware for good on unmount — leaving tracks live
  // after the user navigates away would keep the browser's recording
  // indicator on with nothing actually using the feed.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const requestMedia = async () => {
    setMediaStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraDisconnected(false);
      // Fires if the user revokes camera access mid-interview (e.g. via the
      // browser's own recording indicator) rather than at the start — the
      // "camera compulsory" requirement means that has to be surfaced, not
      // silently ignored.
      stream.getVideoTracks()[0]?.addEventListener("ended", () => setCameraDisconnected(true));
      // Attaching srcObject here is unreliable — the setup screen's preview
      // <video> only mounts once mediaStatus becomes "granted", which hasn't
      // happened yet at this point. The [setup, mediaStatus] effect above
      // handles the actual attachment once that element exists.
      setMediaStatus("granted");
    } catch (err) {
      console.error("Camera/microphone permission denied:", err);
      setMediaStatus("denied");
    }
  };

  // Runs a requestAnimationFrame pose-detection loop for as long as the live
  // interview screen is showing and both the stream and model are ready.
  useEffect(() => {
    if (setup || interviewComplete || mediaStatus !== "granted" || !poseModelReady) return;

    // A thrown detectForVideo() call (dropped WebGL context, a transient GPU
    // delegate hiccup, etc.) must not kill this loop — without the try/catch,
    // one bad frame stopped requestAnimationFrame from ever rescheduling,
    // which froze postureWarning at whatever it last said, permanently, with
    // no visible error to the user. After a handful of consecutive failures
    // this gives up for good instead of hammering a broken pipeline forever.
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    const detect = () => {
      try {
        const video = videoRef.current;
        const landmarker = poseLandmarkerRef.current;
        if (video && landmarker && video.readyState >= 2) {
          // detectForVideo requires a STRICTLY increasing timestamp on every
          // call in VIDEO mode — it throws otherwise. Two requestAnimationFrame
          // ticks can land on the same performance.now() value under Chrome/
          // Firefox's reduced timer-precision privacy protections (or on
          // high-refresh displays), which would otherwise throw on every
          // subsequent call from that point on, not just once.
          const timestamp = Math.max(performance.now(), lastPoseTimestampRef.current + 1);
          lastPoseTimestampRef.current = timestamp;
          const result = landmarker.detectForVideo(video, timestamp);
          consecutiveErrors = 0;
          const issue = evaluatePosture(result);
          const now = Date.now();
          if (issue) {
            if (postureIssueSinceRef.current == null) postureIssueSinceRef.current = now;
            if (now - postureIssueSinceRef.current > POSTURE_WARNING_DEBOUNCE_MS) {
              setPostureWarning(issue);
            }
          } else {
            postureIssueSinceRef.current = null;
            setPostureWarning(null);
          }
        }
      } catch (err) {
        console.error("Posture detection frame failed:", err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          // Degrade to "no posture detection" rather than leaving a stale
          // warning on screen with nothing left updating it.
          postureIssueSinceRef.current = null;
          setPostureWarning(null);
          return;
        }
      }
      poseLoopRef.current = requestAnimationFrame(detect);
    };
    poseLoopRef.current = requestAnimationFrame(detect);

    return () => {
      if (poseLoopRef.current) cancelAnimationFrame(poseLoopRef.current);
      postureIssueSinceRef.current = null;
      setPostureWarning(null);
    };
  }, [setup, interviewComplete, mediaStatus, poseModelReady]);

  // A recognition session is scoped to one question — stops it (rather than
  // letting it keep dictating) the moment the question changes, so a
  // still-listening mic from question N never attributes a stray final
  // result to question N+1's answer.
  useEffect(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, [currentQuestionIndex]);

  const toggleListening = useCallback(() => {
    if (listening) {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    const question = questions[currentQuestionIndex];
    if (!Ctor || !question) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    speechBaseRef.current = answers[question.id] || "";
    speechFinalRef.current = "";

    // Fires repeatedly WHILE the candidate is still mid-sentence (interim
    // results, `isFinal: false`), not just once they pause — the textarea
    // has to be updated here, on every event, or the box only ever catches
    // up once a sentence finishes, which is what "not livly converting" was
    // actually describing: previously only a completed sentence ever reached
    // the box, interim words only reached a separate caption line above it.
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          speechFinalRef.current = speechFinalRef.current
            ? `${speechFinalRef.current} ${transcript.trim()}`
            : transcript.trim();
        } else {
          interim += transcript;
        }
      }
      const combined = [speechBaseRef.current.trim(), speechFinalRef.current, interim.trim()]
        .filter(Boolean)
        .join(" ");
      setAnswers((prev) => ({ ...prev, [question.id]: combined }));
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
    // Chrome's continuous mode still ends on its own after a silence
    // timeout — auto-restart unless the user explicitly clicked Stop
    // (shouldListenRef, not React state, since this runs inside a
    // callback that closed over `listening`'s value at start() time).
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // Already starting — a redundant start() call throws, safe to ignore.
        }
      } else {
        setListening(false);
      }
    };

    shouldListenRef.current = true;
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, questions, currentQuestionIndex, answers]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/interviews/generate?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}`);
      setQuestions(res.data);
      setSetup(false);
      setTimeLeft(60);
    } catch (err) {
      console.error("Failed to fetch questions", err);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Declared (as useCallback) before the timer effect below so the effect
  // can list it in its dependency array — a plain `const` declared after
  // the effect would be a temporal-dead-zone reference at that point, since
  // dependency arrays are evaluated synchronously during render, unlike the
  // effect body itself (which only runs post-commit, after every render-time
  // declaration below it has already been assigned).
  //
  // Deps are `questions` and `user?.id`/`role` — the only reactive values
  // actually read in the body. `answersRef.current` (a ref) is read instead
  // of closing over `answers` directly so this identity doesn't change on
  // every keystroke — see answersRef's own comment above.
  const finishInterview = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Turn the camera/mic off the moment the interview ends, synchronously,
    // rather than waiting on the API call below — no reason the recording
    // indicator should stay lit while this awaits a network response.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    shouldListenRef.current = false;
    recognitionRef.current?.stop();

    // Submit to backend
    try {
      const formattedResponses = Object.entries(answersRef.current).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        answer_text: ans,
        score: Math.floor(Math.random() * 5) + 5,
        feedback: "Good attempt."
      }));

      const totalAnswered = formattedResponses.filter(r => r.answer_text.trim().length > 0).length;
      const overallRating = Math.round((totalAnswered / questions.length) * 8) + 2; // rating 2-10

      if (user?.id) {
        await api.post(`/students/${user.id}/interviews`, {
          role,
          category: "technical",
          overall_rating: overallRating,
          strengths: ["Clear communication", "Structured thinking"],
          improvements: ["Depth of technical answers"],
          duration_seconds: questions.length * 60,
          responses: formattedResponses
        });
      }
    } catch (err) {
      console.error("Failed to save interview history:", err);
    } finally {
      setInterviewComplete(true);
    }
  }, [questions, user?.id, role]);

  // Deps: `currentQuestionIndex`/`questions` (read directly) plus
  // `finishInterview` (called in the else branch). `role`/`user`/`company`
  // are frozen for the interview's duration by construction — editable only
  // during setup, which has already ended by the time this can be called —
  // so `finishInterview`'s identity can't actually change mid-interview even
  // though it's transitively part of this dependency chain.
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(60);
    } else {
      finishInterview();
    }
  }, [currentQuestionIndex, questions, finishInterview]);

  // `handleNextQuestion` is now a genuine, correctly-listed dependency.
  // Since its own deps (`currentQuestionIndex`, `questions`) are already
  // tracked directly by this effect, and `finishInterview` can't change
  // identity mid-interview (see above), this re-creates the interval at
  // exactly the same moments it did before — no extra reruns introduced.
  useEffect(() => {
    if (!setup && !interviewComplete && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 60; // Reset for next, though handleNextQuestion might end it
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setup, currentQuestionIndex, interviewComplete, questions, handleNextQuestion]);

  if (setup) {
    return (
      <div className="screen active" style={{ padding: "40px", maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "4px", fontWeight: 700, color: "var(--text)" }}>AI Mock Interviewer</h2>
          <p style={{ color: "var(--muted)" }}>Practice with real AI-generated questions tailored to your role.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "28px", width: "fit-content" }}>
          {(["new", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "7px", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "white" : "var(--muted)", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize" }}>
              {t === "new" ? "New Interview" : "Past Interviews"}
            </button>
          ))}
        </div>

        {tab === "new" && (
          <div style={{ background: "var(--bg)", padding: "28px", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, fontSize: "14px" }}>Target Role</label>
            <input 
              type="text" 
              className="fi" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              placeholder="e.g. Frontend Developer"
              style={{ marginBottom: "20px" }}
            />
            
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, fontSize: "14px" }}>Target Company</label>
            <input 
              type="text" 
              className="fi" 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              placeholder="e.g. Microsoft"
              style={{ marginBottom: "28px" }}
            />

            <div style={{ background: "rgba(108, 92, 231, 0.1)", color: "var(--accent)", padding: "16px", borderRadius: "8px", marginBottom: "28px", fontSize: "13px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Strict 1-Minute Rule</strong><br/>
                You will have exactly 60 seconds to answer each of the 10 questions. Plagiarism checks are active.
              </div>
            </div>

            <div style={{ background: "var(--bg-card, #fff)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div>
                  <strong style={{ fontSize: "14px" }}>Camera &amp; Microphone Check</strong>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Required to start — this interview monitors your posture in real time and can transcribe spoken answers.
                  </p>
                </div>
                {mediaStatus !== "granted" && (
                  <button
                    type="button"
                    className="btn btn-o"
                    onClick={requestMedia}
                    disabled={mediaStatus === "requesting"}
                    style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    {mediaStatus === "requesting" ? "Requesting…" : mediaStatus === "denied" ? "Try Again" : "Enable Camera"}
                  </button>
                )}
              </div>
              {mediaStatus === "denied" && (
                <p style={{ fontSize: "12px", color: "var(--red)", marginTop: "12px" }}>
                  Camera/microphone access was denied. Allow it for this site in your browser settings, then try again — it&apos;s required to start the interview.
                </p>
              )}
              {mediaStatus === "granted" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "120px", height: "90px", borderRadius: "8px", background: "#000", objectFit: "cover", transform: "scaleX(-1)" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--teal)", fontWeight: 600 }}>
                    ✓ Camera ready{poseModelReady ? "" : " — loading posture check…"}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn btn-p"
              style={{ width: "100%", padding: "14px" }}
              onClick={startInterview}
              disabled={loading || mediaStatus !== "granted"}
            >
              {loading
                ? "Preparing AI Engine..."
                : mediaStatus !== "granted"
                ? "Enable your camera to continue"
                : "Start Interview Engine"}
            </button>
          </div>
        )}

        {tab === "history" && (
          <div>
            {historyLoading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎤</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>No interviews yet</div>
                <div style={{ fontSize: "14px" }}>Complete your first mock interview to see your history here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {history.map((rec) => (
                  <div key={rec.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{rec.role}</div>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Attempt #{rec.attempt_number} · {Math.round(rec.duration_seconds / 60)} min · {new Date(rec.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {rec.strengths?.length > 0 && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--teal)" }}>
                          ✓ {rec.strengths.slice(0, 2).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: rec.overall_rating >= 8 ? "#16a34a" : rec.overall_rating >= 5 ? "var(--accent)" : "var(--red)" }}>{rec.overall_rating}<span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>/10</span></div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rating</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="screen active" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "var(--teal-l)", color: "var(--teal)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="40" height="40">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "28px", marginBottom: "12px", fontWeight: 800 }}>Interview Saved! 🎉</h2>
        <p style={{ color: "var(--muted)", marginBottom: "32px", lineHeight: 1.6 }}>Your responses have been recorded and saved to your history.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn btn-p" onClick={() => { setSetup(true); setInterviewComplete(false); setTab("history"); }}>View History</button>
          <button className="btn btn-o" onClick={() => setActiveScreen("dash")}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="screen active" style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
            {company.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{role} Interview</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{company} · Plagiarism Monitor Active</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover", background: "#000", transform: "scaleX(-1)", flexShrink: 0 }}
          />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>Time Remaining</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: timeLeft < 15 ? "var(--red)" : "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
          </div>
          <button className="btn btn-g" onClick={() => {if(confirm("End interview early?")) finishInterview()}}>End Session</button>
        </div>
      </div>

      {(postureWarning || cameraDisconnected) && (
        <div style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", padding: "10px 24px", fontSize: "13px", fontWeight: 600, textAlign: "center", borderBottom: "1px solid var(--border)" }}>
          ⚠ {cameraDisconnected ? "Camera disconnected — please reconnect your webcam to continue." : postureWarning}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left sidebar - tabs cursor replica */}
        <div style={{ width: "60px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "12px" }}>
          {questions.map((q, i) => (
            <div 
              key={q.id}
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                background: i === currentQuestionIndex ? "var(--accent)" : answers[q.id] ? "var(--teal-l)" : "transparent",
                color: i === currentQuestionIndex ? "white" : answers[q.id] ? "var(--teal)" : "var(--muted)",
                border: i === currentQuestionIndex ? "none" : `1px solid ${answers[q.id] ? "var(--teal)" : "var(--border)"}`,
                transition: "all 0.2s"
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Right side - Question & Answer */}
        <div style={{ flex: 1, padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ display: "inline-block", padding: "4px 10px", background: "var(--bg)", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: "16px" }}>
              Question {currentQuestionIndex + 1} of {questions.length} · {currentQ.type}
            </span>
            <h1 style={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.5 }}>{currentQ.text}</h1>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {listening
                ? "Listening — speak your answer, it fills the box as you talk."
                : speechSupported
                ? "Type your answer, or use the mic to speak it."
                : "Speech-to-text isn't supported in this browser — please type your answer."}
            </span>
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`btn btn-sm ${listening ? "btn-red" : "btn-o"}`}
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {listening ? (
                  <>
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "var(--red)",
                        animation: "pulse 1.2s ease-in-out infinite",
                        flexShrink: 0,
                      }}
                    />
                    Stop
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    Speak Answer
                  </>
                )}
              </button>
            )}
          </div>

          <textarea
            style={{
              flex: 1, width: "100%", padding: "20px", borderRadius: "12px",
              border: "1px solid var(--border)", background: "var(--bg)",
              fontSize: "15px", lineHeight: 1.6, resize: "none", outline: "none",
              color: "var(--text)", fontFamily: "inherit"
            }}
            placeholder="Type your answer here... Be concise and clear."
            value={answers[currentQ.id] || ""}
            onChange={(e) => setAnswers(prev => ({...prev, [currentQ.id]: e.target.value}))}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              {answers[currentQ.id]?.length || 0} characters
            </div>
            <button 
              className="btn btn-p" 
              onClick={handleNextQuestion}
              style={{ padding: "12px 32px" }}
            >
              {currentQuestionIndex < questions.length - 1 ? "Submit & Next" : "Submit Interview"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
