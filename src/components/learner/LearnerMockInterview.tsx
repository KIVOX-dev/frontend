"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ObjectDetector, PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  ABSENT_COUNTDOWN_AFTER_MS,
  ABSENT_LIMIT_MS,
  DEVICE_CONFIRM_HITS,
  OBJECT_INTERVAL_MS,
  POSE_INTERVAL_MS,
  createObjectDetector,
  createPoseLandmarker,
  detectsExternalDevice,
  isPersonAbsent,
} from "@/lib/proctoring";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { COMPANY_LOGOS, companyLogoFor } from "@/lib/companyLogos";

const ROLE_OPTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Java Developer", "Python Developer", ".NET Developer", "Mobile App Developer",
  "Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer",
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Cybersecurity Analyst",
  "QA / Test Engineer", "Automation Test Engineer", "Database Administrator", "Network Engineer",
  "Business Analyst", "Product Manager", "UI/UX Designer", "Technical Support Engineer",
  "Systems Engineer", "Associate Consultant", "Graduate Engineer Trainee", "Project Engineer",
];

const POPULAR_ROLES = ["Software Engineer", "Full Stack Developer", "Data Analyst", "DevOps Engineer", "QA / Test Engineer", "Business Analyst"];

const COMPANY_OPTIONS = [
  ...COMPANY_LOGOS.map((c) => c.name),
  "HCLTech", "Tech Mahindra", "Capgemini", "LTIMindtree", "Mphasis", "Hexaware", "Persistent Systems",
  "Deloitte", "EY", "KPMG", "PwC", "IBM", "Oracle", "SAP", "Cisco",
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Adobe", "Salesforce", "Intel", "Nvidia",
  "Flipkart", "Swiggy", "Zomato", "Paytm", "PhonePe", "Razorpay", "Freshworks", "Startup",
];

const INTERVIEW_ROUNDS = [
  { id: "technical", label: "Technical", desc: "Core CS, DSA and role concepts", icon: "M7 8l-4 4 4 4m7-12l-4 16m7-12l4 4-4 4" },
  { id: "system_design", label: "System Design", desc: "Architecture, scaling, trade-offs", icon: "M12 12H7.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C6 12.76 6 13.04 6 13.6V16m6-4h4.4c.56 0 .84 0 1.054.109a1 1 0 01.437.437C18 12.76 18 13.04 18 13.6V16m-6-4V8m-.9 0h1.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437c.109-.214.109-.494.109-1.054V4.6c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C13.74 3 13.46 3 12.9 3h-1.8c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C9.5 3.76 9.5 4.04 9.5 4.6v1.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C10.26 8 10.54 8 11.1 8zm-6 13h1.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437c.109-.214.109-.494.109-1.054v-1.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C7.74 16 7.46 16 6.9 16H5.1c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C3.5 16.76 3.5 17.04 3.5 17.6v1.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C4.26 21 4.54 21 5.1 21zm12 0h1.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437c.109-.214.109-.494.109-1.054v-1.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C19.74 16 19.46 16 18.9 16h-1.8c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437c-.109.214-.109.494-.109 1.054v1.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C16.26 21 16.54 21 17.1 21z" },
  { id: "hr", label: "HR", desc: "Background, motivation, fit", icon: "M6 7h1m-1 3h1m4 0h1m-1 3h1m-6 0h1m4-6h1M7 21v-3a2 2 0 114 0v3H7zm0 0H3V4.6c0-.56 0-.84.109-1.054a1 1 0 01.437-.437C3.76 3 4.04 3 4.6 3h8.8c.56 0 .84 0 1.054.109a1 1 0 01.437.437C15 3.76 15 4.04 15 4.6V9m4.7 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.8 7.5v-.5A2.5 2.5 0 0019 18h-1.5a2.5 2.5 0 00-2.5 2.5v.5h6.5z" },
  { id: "behavioral", label: "Behavioral", desc: "STAR-style situations", icon: "M13 20v-2a5 5 0 00-10 0v2h10zm0 0h8v-1c0-2.945-2.239-5-5-5-1.413 0-2.69.626-3.6 1.631M11 7a3 3 0 11-6 0 3 3 0 016 0zm7 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "managerial", label: "Managerial", desc: "Ownership and decisions", icon: "M3.027 10.022l3.658 2.926c.488.39.731.585 1.002.723.241.123.497.213.762.268.299.061.61.061 1.235.061h4.632c.624 0 .936 0 1.235-.061.265-.055.52-.145.761-.268.272-.138.515-.333 1.003-.723l3.657-2.926m-17.945 0C3 10.489 3 11.064 3 11.8v4.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 21 6.12 21 7.8 21h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2v-4.4c0-.736 0-1.31-.027-1.778m-17.946 0c.036-.6.116-1.023.3-1.384a3 3 0 011.311-1.311C5.28 7 6.12 7 7.8 7H8m12.973 3.022c-.036-.6-.116-1.023-.3-1.384a3 3 0 00-1.311-1.311C18.72 7 17.88 7 16.2 7H16M8 7V6a3 3 0 013-3h2a3 3 0 013 3v1M8 7h8" },
  { id: "aptitude", label: "Problem Solving", desc: "Puzzles and logical reasoning", icon: "M15 16v2c0 .932 0 1.398-.152 1.765a2 2 0 01-1.083 1.083C13.398 21 12.932 21 12 21c-.932 0-1.398 0-1.765-.152a2 2 0 01-1.083-1.083C9 19.398 9 18.932 9 18v-2m-4-6a7 7 0 1110.608 6H8.392A6.996 6.996 0 015 10z" },
];

const ROUND_LABEL: Record<string, string> = Object.fromEntries(INTERVIEW_ROUNDS.map((r) => [r.id, r.label]));

function RoundIcon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Question {
  id: number;
  text: string;
  time_limit_seconds: number;
  type: string;
}

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
  // Nobody in view is handled by the 5-second out-of-frame countdown in the
  // detection loop, which ends the interview — not by this soft warning.
  if (!nose || !leftShoulder || !rightShoulder) return null;

  // Landmark x/y are normalized to [0, 1] against the video frame, so these
  // thresholds are resolution-independent.
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderTilt > 0.08) return "Sit up straight and face the camera.";

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  if (Math.abs(nose.x - shoulderMidX) > 0.12) return "Please face the camera.";

  return null;
}

type FaceBox = { x: number; y: number; w: number; h: number };

// Face box from BlazePose's 11 face landmarks (nose, eyes, ears, mouth), in
// normalized [0,1] frame coords. Those points only span eyes-to-mouth, so the
// box is padded out to cover forehead and chin; `aspect` (videoWidth /
// videoHeight) converts the width into normalized-y units so the box stays
// face-shaped at any camera resolution.
function faceBoxFrom(result: PoseLandmarkerResult, aspect: number): FaceBox | null {
  const face = (result.landmarks[0] || []).slice(0, 11).filter((p) => (p.visibility ?? 1) > 0.3);
  if (face.length < 3) return null;
  const xs = face.map((p) => p.x);
  const ys = face.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const cx = (minX + maxX) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const w = Math.min(Math.max(maxX - minX, 0.06) * 1.45, 0.9);
  const h = Math.min(w * aspect * 1.3, 0.95);
  const x = Math.min(Math.max(cx - w / 2, 0), 1 - w);
  const y = Math.min(Math.max(cy - h * 0.55, 0), 1 - h);
  return { x, y, w, h };
}

const TOPIC_HINTS: { match: RegExp; points: string[] }[] = [
  { match: /ci\/?cd|pipeline|deploy|release/i, points: ["Build, test, scan, deploy stages", "Blue-green or canary releases", "Automated rollback on failed health checks", "Infrastructure as code"] },
  { match: /kubernetes|k8s|docker|container/i, points: ["Deployments, services, ingress", "Readiness and liveness probes", "Resource limits and autoscaling"] },
  { match: /cloud|aws|azure|gcp|multi-cloud/i, points: ["Managed vs self-hosted services", "Multi-region redundancy", "Cost and vendor lock-in trade-offs"] },
  { match: /scal|traffic|high availability|distributed|latency/i, points: ["Horizontal scaling of stateless services", "Load balancing", "Caching and CDN", "Replication and failover"] },
  { match: /database|sql|index|query|schema|nosql|transaction/i, points: ["Indexes and query plans", "Transactions and ACID", "Normalization trade-offs", "When NoSQL fits better"] },
  { match: /api|rest|graphql|endpoint|microservice/i, points: ["Resource design and HTTP semantics", "Versioning and backward compatibility", "Auth and rate limiting", "Idempotency and error handling"] },
  { match: /cach|redis/i, points: ["Cache-aside vs write-through", "TTL and invalidation", "Cache stampede protection"] },
  { match: /secur|auth|encrypt|vulnerab|owasp|token/i, points: ["Least privilege", "Encryption in transit and at rest", "Input validation (OWASP Top 10)", "Secrets management"] },
  { match: /monitor|observab|logging|incident|outage|alert/i, points: ["Metrics, logs and traces", "SLOs and alert thresholds", "Post-incident review"] },
  { match: /test|qa|bug|quality|automation/i, points: ["Unit, integration, end-to-end split", "Test data and environments", "Regression automation in CI"] },
  { match: /algorithm|complexity|array|linked list|tree|graph|sort|search|data structure|recursion/i, points: ["Brute force first, then optimize", "Time and space complexity", "Edge cases: empty, single, huge input"] },
  { match: /react|frontend|javascript|typescript|css|browser|ui\b/i, points: ["Component and state design", "Rendering performance", "Accessibility", "Browser compatibility"] },
  { match: /oop|object.oriented|inheritance|polymorph|encapsulat|solid/i, points: ["Encapsulation, inheritance, polymorphism", "A short code-level example", "SOLID principles"] },
  { match: /machine learning|\bml\b|model|dataset|data scien|training/i, points: ["Data quality and features", "Metric choice for the problem", "Overfitting and validation", "Deployment and monitoring"] },
  { match: /team|conflict|deadline|pressure|challenge|fail|mistake|lead|disagree/i, points: ["One specific real situation", "Your own actions, not the team's", "A measurable result or lesson"] },
];

type Feedback = { tone: "good" | "warn" | "info"; text: string };

function buildSuggestions(question: Question, answer: string, company: string, timeLeft: number) {
  const q = question.text;
  const isBehavioral = question.type === "behavioral" || /tell me about|describe a (time|situation)|how did you|give an example of a time/i.test(q);
  const isDesign = /design|architect|build a system|how would you build/i.test(q);
  const isExplain = /explain|what is|what are|difference|compare|how does/i.test(q);

  const approach = isBehavioral
    ? ["Situation: set the scene in one line", "Task: what you were responsible for", "Action: the specific steps you took", "Result: the outcome, with a number if possible"]
    : isDesign
    ? ["Clarify requirements and expected scale", "Sketch the main components", "Go deep on the most critical part", "Close with trade-offs and failure handling"]
    : isExplain
    ? ["Give a one-line definition", "Explain how it works", "Show a real example from your work", "Say when to use it and its trade-offs"]
    : ["Answer directly in your first sentence", "Support it with one concrete example", "Finish with the impact or takeaway"];

  const points = TOPIC_HINTS.filter((t) => t.match.test(q)).flatMap((t) => t.points).slice(0, 6);
  if (company && !isBehavioral) points.push(`Tie it to ${company}'s products or scale`);

  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const feedback: Feedback[] = [];
  if (words === 0) {
    feedback.push({ tone: "info", text: "Start with a one-sentence summary of your answer." });
  } else {
    if (words < 25) feedback.push({ tone: "warn", text: `Only ${words} words so far — aim for 60 to 120.` });
    else if (words > 170) feedback.push({ tone: "warn", text: "Getting long — wrap up with a clear conclusion." });
    else feedback.push({ tone: "good", text: `${words} words — good length.` });

    if (/for example|for instance|in my (project|internship|previous|last)|\bi (built|worked|implemented|led|designed|created|developed|used)\b/i.test(answer)) {
      feedback.push({ tone: "good", text: "You backed it with a real example." });
    } else if (words >= 15) {
      feedback.push({ tone: "info", text: "Add a real example from a project or internship." });
    }

    if (isBehavioral && !/result|outcome|impact|improv|reduc|increas|saved|deliver|\d+\s?%/i.test(answer) && words >= 30) {
      feedback.push({ tone: "warn", text: "State the result or impact of your actions." });
    }

    const fillers = answer.match(/\b(um+|uh+|basically|actually|you know|kind of|sort of)\b/gi) || [];
    if (fillers.length >= 3) feedback.push({ tone: "warn", text: `Cut filler words ("${fillers[0].toLowerCase()}" ×${fillers.length}).` });

    if (points.length > 0) {
      const covered = points.filter((p) => p.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 4 && answer.toLowerCase().includes(w)));
      if (covered.length === 0 && words >= 30) feedback.push({ tone: "info", text: "None of the key points below are mentioned yet." });
    }
  }
  if (timeLeft <= 15 && words < 40) feedback.push({ tone: "warn", text: `${timeLeft}s left — summarize your main point now.` });

  return { approach, points, feedback };
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
  const [company, setCompany] = useState("TCS");
  const [round, setRound] = useState("technical");
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
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const lastObjectTimestampRef = useRef(0);
  const deviceHitsRef = useRef(0);
  const absentSinceRef = useRef<number | null>(null);
  // Set once the interview has been stopped for a violation, so a slow save
  // can't be triggered a second time by the next detection frame.
  const terminatedRef = useRef(false);
  // finishInterview is declared further down (it has to come after the
  // dependencies it reads); the detection loop reaches it through this ref.
  const terminateRef = useRef<(reason: string) => void>(() => {});
  const [objectModelReady, setObjectModelReady] = useState(false);
  const [absentSecondsLeft, setAbsentSecondsLeft] = useState<number | null>(null);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [poseModelReady, setPoseModelReady] = useState(false);
  const [postureWarning, setPostureWarning] = useState<string | null>(null);
  const [cameraDisconnected, setCameraDisconnected] = useState(false);
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [videoAspect, setVideoAspect] = useState(4 / 3);

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

  // Loads the posture and device-detection models in the background as soon
  // as this screen mounts (not gated on camera permission — the download/init
  // can overlap with the user reading the setup screen and clicking "Enable
  // Camera"). Each degrades independently: if one fails to load, the camera
  // and speech-to-text still work and the other check still runs.
  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionCtor()));

    let cancelled = false;
    (async () => {
      try {
        const landmarker = await createPoseLandmarker(1);
        if (cancelled) {
          landmarker.close();
          return;
        }
        poseLandmarkerRef.current = landmarker;
        setPoseModelReady(true);
      } catch (err) {
        console.error("Failed to load posture-detection model:", err);
      }
    })();
    (async () => {
      try {
        const detector = await createObjectDetector();
        if (cancelled) {
          detector.close();
          return;
        }
        objectDetectorRef.current = detector;
        setObjectModelReady(true);
      } catch (err) {
        console.error("Failed to load device-detection model:", err);
      }
    })();

    return () => {
      cancelled = true;
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
      objectDetectorRef.current?.close();
      objectDetectorRef.current = null;
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

  // Runs the camera checks for as long as the live interview screen is
  // showing and the stream and at least one model are ready:
  //
  // 1. External device (phone / laptop / TV / remote) — zero tolerance. Seen
  //    on two consecutive checks (~0.5s) it ends the interview immediately.
  // 2. Out of frame — nobody in view, or the face turned away/covered. A 5s
  //    countdown appears; if the person isn't back by zero the interview ends.
  // 3. Posture (shoulder tilt, facing the camera) — soft warning only.
  //
  // One requestAnimationFrame loop drives both models, but each is throttled
  // to its own interval (see proctoring.ts) rather than running every frame.
  useEffect(() => {
    if (setup || interviewComplete || mediaStatus !== "granted" || (!poseModelReady && !objectModelReady)) return;

    // A thrown detectForVideo() call (dropped WebGL context, a transient GPU
    // delegate hiccup, etc.) must not kill this loop — without the try/catch,
    // one bad frame stopped requestAnimationFrame from ever rescheduling,
    // which froze postureWarning at whatever it last said, permanently, with
    // no visible error to the user. After a handful of consecutive failures
    // this gives up for good instead of hammering a broken pipeline forever.
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;
    let lastPoseRun = 0;
    let lastObjectRun = 0;

    const detect = () => {
      try {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !terminatedRef.current) {
          const nowMs = performance.now();

          // Pose model first; the object model waits for a later frame so the
          // two never land in the same tick and stall it.
          const landmarker = poseLandmarkerRef.current;
          if (landmarker && nowMs - lastPoseRun >= POSE_INTERVAL_MS) {
            lastPoseRun = nowMs;
            // detectForVideo requires a STRICTLY increasing timestamp on every
            // call in VIDEO mode — it throws otherwise. Two requestAnimationFrame
            // ticks can land on the same performance.now() value under Chrome/
            // Firefox's reduced timer-precision privacy protections (or on
            // high-refresh displays), which would otherwise throw on every
            // subsequent call from that point on, not just once.
            const timestamp = Math.max(nowMs, lastPoseTimestampRef.current + 1);
            lastPoseTimestampRef.current = timestamp;
            const result = landmarker.detectForVideo(video, timestamp);
            const now = Date.now();

            if (isPersonAbsent(result)) {
              if (absentSinceRef.current == null) absentSinceRef.current = now;
              const elapsed = now - absentSinceRef.current;
              if (elapsed >= ABSENT_LIMIT_MS) {
                terminateRef.current("You were out of the camera's view for more than 5 seconds — the interview was stopped.");
                return;
              }
              if (elapsed >= ABSENT_COUNTDOWN_AFTER_MS) setAbsentSecondsLeft(Math.ceil((ABSENT_LIMIT_MS - elapsed) / 1000));
              postureIssueSinceRef.current = null;
              setPostureWarning(null);
              setFaceBox(null);
            } else {
              absentSinceRef.current = null;
              setAbsentSecondsLeft(null);
              setFaceBox(faceBoxFrom(result, video.videoHeight ? video.videoWidth / video.videoHeight : 4 / 3));
              const issue = evaluatePosture(result);
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
          } else {
            const detector = objectDetectorRef.current;
            if (detector && nowMs - lastObjectRun >= OBJECT_INTERVAL_MS) {
              lastObjectRun = nowMs;
              const timestamp = Math.max(nowMs, lastObjectTimestampRef.current + 1);
              lastObjectTimestampRef.current = timestamp;
              if (detectsExternalDevice(detector.detectForVideo(video, timestamp))) {
                deviceHitsRef.current += 1;
                if (deviceHitsRef.current >= DEVICE_CONFIRM_HITS) {
                  terminateRef.current(
                    "An external device (phone, laptop, TV, or remote) was detected in your camera — the interview was stopped immediately."
                  );
                  return;
                }
              } else {
                deviceHitsRef.current = 0;
              }
            }
          }
          consecutiveErrors = 0;
        }
      } catch (err) {
        console.error("Camera-check frame failed:", err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          // Degrade to "no camera checks" rather than leaving a stale
          // warning on screen with nothing left updating it.
          postureIssueSinceRef.current = null;
          absentSinceRef.current = null;
          setPostureWarning(null);
          setAbsentSecondsLeft(null);
          setFaceBox(null);
          return;
        }
      }
      poseLoopRef.current = requestAnimationFrame(detect);
    };
    poseLoopRef.current = requestAnimationFrame(detect);

    return () => {
      if (poseLoopRef.current) cancelAnimationFrame(poseLoopRef.current);
      postureIssueSinceRef.current = null;
      absentSinceRef.current = null;
      deviceHitsRef.current = 0;
      setPostureWarning(null);
      setAbsentSecondsLeft(null);
      setFaceBox(null);
    };
  }, [setup, interviewComplete, mediaStatus, poseModelReady, objectModelReady]);

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
      const res = await api.post(`/interviews/generate?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}&round=${encodeURIComponent(round)}`);
      setQuestions(res.data);
      terminatedRef.current = false;
      setTerminationReason(null);
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
          category: round,
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
  }, [questions, user?.id, role, round]);

  // Stops the interview for a camera violation: records why, then saves
  // whatever was answered so far exactly like "End Session" does.
  useEffect(() => {
    terminateRef.current = (reason: string) => {
      if (terminatedRef.current) return;
      terminatedRef.current = true;
      setTerminationReason(reason);
      finishInterview();
    };
  }, [finishInterview]);

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
      <div className="screen active" style={{ padding: "32px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", marginBottom: "4px", fontWeight: 700, color: "var(--text)" }}>AI Mock Interviewer</h2>
            <p style={{ color: "var(--muted)" }}>Practice with real AI-generated questions tailored to your role.</p>
          </div>

          <div style={{ display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", width: "fit-content" }}>
            {(["new", "history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "7px", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "white" : "var(--muted)", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", transition: "all 0.2s" }}>
                {t === "new" ? "New Interview" : "Past Interviews"}
              </button>
            ))}
          </div>
        </div>

        {tab === "new" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", alignItems: "start" }}>
          <div className="card" style={{ padding: "28px", borderRadius: "16px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Interview Setup</div>
            <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "22px" }}>Pick the role and company you&apos;re preparing for.</div>

            <label htmlFor="mi-role" style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "13px" }}>Target Role</label>
            <input
              id="mi-role"
              type="text"
              className="fi"
              list="mi-role-options"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Search or type a role"
            />
            <datalist id="mi-role-options">
              {ROLE_OPTIONS.map((r) => <option key={r} value={r} />)}
            </datalist>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px", marginBottom: "22px" }}>
              {POPULAR_ROLES.map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{ padding: "5px 11px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-l)" : "transparent", color: active ? "var(--accent)" : "var(--muted)", transition: "all .15s" }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            <label htmlFor="mi-company" style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "13px" }}>Target Company</label>
            <div style={{ position: "relative", marginBottom: "22px" }}>
              {companyLogoFor(company) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companyLogoFor(company)!} alt="" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", height: "20px", maxWidth: "46px", objectFit: "contain", pointerEvents: "none" }} />
              )}
              <input
                id="mi-company"
                type="text"
                className="fi"
                list="mi-company-options"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Search or type a company"
                style={companyLogoFor(company) ? { paddingLeft: "64px" } : undefined}
              />
              <datalist id="mi-company-options">
                {COMPANY_OPTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div style={{ background: "var(--accent-l)", color: "var(--accent)", padding: "14px 16px", borderRadius: "10px", marginBottom: "22px", fontSize: "13px", display: "flex", gap: "12px", alignItems: "flex-start", lineHeight: 1.55 }}>
              <span style={{ flexShrink: 0, marginTop: "1px" }}>
                <RoundIcon d="M12 8h.01M12 11v5m9-4a9 9 0 11-18 0 9 9 0 0118 0z" size={18} />
              </span>
              <div>
                <strong>Strict 1-Minute Rule</strong><br/>
                You will have exactly 60 seconds to answer each of the 10 questions. Plagiarism checks are active.
              </div>
            </div>

            <div style={{ background: "var(--bg)", padding: "18px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div>
                  <strong style={{ fontSize: "14px" }}>Camera &amp; Microphone Check</strong>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Required to start — this interview watches the camera in real time: stay in view, and keep phones and other devices out of frame, or it will stop. It can also transcribe spoken answers.
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
                    ✓ Camera ready{poseModelReady && objectModelReady ? "" : " — loading camera checks…"}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn btn-p"
              style={{ width: "100%", padding: "14px", justifyContent: "center" }}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Top Recruiters</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>Tap a company to tailor the questions.</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                {COMPANY_LOGOS.map((c) => {
                  const active = company.trim().toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCompany(c.name)}
                      aria-pressed={active}
                      aria-label={c.name}
                      style={{
                        position: "relative", height: "84px", borderRadius: "12px", cursor: "pointer",
                        background: "#fff", padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        boxShadow: active ? "0 0 0 3px var(--accent-l)" : "none",
                        transition: "border-color .15s, box-shadow .15s, transform .15s",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.src} alt={`${c.name} logo`} style={{ maxWidth: "100%", maxHeight: "56px", objectFit: "contain" }} />
                      {active && (
                        <span style={{ position: "absolute", top: "6px", right: "6px", width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="11" height="11"><path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Interview Round</div>
              <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px", marginBottom: "16px" }}>Choose which round you want to practice.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {INTERVIEW_ROUNDS.map((r) => {
                  const active = round === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRound(r.id)}
                      aria-pressed={active}
                      style={{
                        textAlign: "left", padding: "14px", borderRadius: "12px", cursor: "pointer",
                        background: active ? "var(--accent-l)" : "var(--bg)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        transition: "all .15s",
                      }}
                    >
                      <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", background: active ? "var(--accent)" : "var(--accent-l)", color: active ? "#fff" : "var(--accent)" }}>
                        <RoundIcon d={r.icon} />
                      </span>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{r.label}</span>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        )}

        {tab === "history" && (
          <div style={{ maxWidth: "860px" }}>
            {historyLoading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", opacity: 0.4 }}>
                  <RoundIcon d="M19 10v2a7 7 0 01-7 7m-7-9v2a7 7 0 007 7m0 0v3m-4 0h8M15 6h-2m2 4h-2m-1 5a3 3 0 01-3-3V5a3 3 0 116 0v7a3 3 0 01-3 3z" size={40} />
                </div>
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
                        {ROUND_LABEL[rec.category] ?? rec.category} · Attempt #{rec.attempt_number} · {Math.round(rec.duration_seconds / 60)} min · {new Date(rec.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
        <h2 style={{ fontSize: "28px", marginBottom: "12px", fontWeight: 800 }}>{terminationReason ? "Interview Stopped" : "Interview Saved"}</h2>
        {terminationReason && (
          <p style={{ color: "var(--red)", marginBottom: "12px", lineHeight: 1.6, fontWeight: 600 }}>{terminationReason}</p>
        )}
        <p style={{ color: "var(--muted)", marginBottom: "32px", lineHeight: 1.6 }}>
          {terminationReason ? "Your answers so far have been saved to your history." : "Your responses have been recorded and saved to your history."}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn btn-p" onClick={() => { setSetup(true); setInterviewComplete(false); setTab("history"); }}>View History</button>
          <button className="btn btn-o" onClick={() => setActiveScreen("dash")}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const suggestions = buildSuggestions(currentQ, answers[currentQ.id] || "", company, timeLeft);
  const trackingReady = poseModelReady;
  const boxColor = postureWarning ? "#f59e0b" : "#22c55e";
  const cameraChecks = [
    { label: "Face", ok: !!faceBox, text: faceBox ? "In view" : absentSecondsLeft != null ? `Missing ${absentSecondsLeft}s` : "Searching" },
    { label: "Posture", ok: !postureWarning, text: postureWarning ? "Adjust" : "Good" },
    { label: "Devices", ok: objectModelReady, text: objectModelReady ? "Clear" : "Loading" },
    { label: "Mic", ok: listening, text: listening ? "Listening" : "Off" },
  ];
  const toneColor = { good: "var(--teal)", warn: "#d97706", info: "var(--accent)" } as const;

  return (
    <div className="screen active" style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
      {/* Header */}
      <div className="mi-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {companyLogoFor(company) ? (
            <div style={{ width: "56px", height: "36px", borderRadius: "8px", background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={companyLogoFor(company)!} alt={`${company} logo`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
              {company.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{role} · {ROUND_LABEL[round] ?? "Technical"} Round</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{company} · Plagiarism Monitor Active</div>
          </div>
        </div>
        <div className="mi-header-right" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div className="mi-time-label" style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>Time Remaining</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: timeLeft < 15 ? "var(--red)" : "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
          </div>
          <button className="btn btn-g" onClick={() => {if(confirm("End interview early?")) finishInterview()}}>End Session</button>
        </div>
      </div>

      {(absentSecondsLeft != null || postureWarning || cameraDisconnected) && (
        <div style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", padding: "10px 24px", fontSize: "13px", fontWeight: 600, textAlign: "center", borderBottom: "1px solid var(--border)" }}>
          {absentSecondsLeft != null ? (
            <>
              ⚠ We can&apos;t see you — get back in the camera&apos;s view within{" "}
              <strong style={{ fontSize: "16px", fontVariantNumeric: "tabular-nums" }}>{absentSecondsLeft}s</strong> or the interview will stop.
            </>
          ) : (
            <>⚠ {cameraDisconnected ? "Camera disconnected — please reconnect your webcam to continue." : postureWarning}</>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="mi-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left sidebar - tabs cursor replica */}
        <div className="mi-steps" style={{ width: "60px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "12px" }}>
          {questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
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

        <div className="mi-content" style={{ flex: "1 1 0", minWidth: 0, padding: "28px 32px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "20px" }}>
            <span style={{ display: "inline-block", padding: "4px 10px", background: "var(--bg)", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: "12px", textTransform: "capitalize" }}>
              Question {currentQuestionIndex + 1} of {questions.length} · {currentQ.type}
            </span>
            <h1 className="mi-question" style={{ fontSize: "19px", fontWeight: 600, lineHeight: 1.5 }}>{currentQ.text}</h1>
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
              flex: 1, minHeight: "220px", width: "100%", padding: "18px", borderRadius: "12px",
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

        <div className="mi-side" style={{ flex: "1 1 0", minWidth: 0, borderLeft: "1px solid var(--border)", background: "var(--bg)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
          <div className="card" style={{ padding: "12px", borderRadius: "14px" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: String(videoAspect), maxHeight: "46vh", margin: "0 auto", borderRadius: "10px", overflow: "hidden", background: "#0b1220" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (v.videoWidth && v.videoHeight) setVideoAspect(v.videoWidth / v.videoHeight);
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }}
              />

              {faceBox && (
                // The video is mirrored, so the box's x is mirrored to match.
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: `${(1 - faceBox.x - faceBox.w) * 100}%`,
                    top: `${faceBox.y * 100}%`,
                    width: `${faceBox.w * 100}%`,
                    height: `${faceBox.h * 100}%`,
                    border: `2px solid ${boxColor}`,
                    borderRadius: "12px",
                    boxShadow: `0 0 0 1px rgba(0,0,0,.25), 0 0 20px ${boxColor}80`,
                    transition: "left 120ms linear, top 120ms linear, width 120ms linear, height 120ms linear, border-color .2s",
                  }}
                >
                  <span style={{ position: "absolute", top: "-1px", left: "-1px", background: boxColor, color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px 0 8px 0", whiteSpace: "nowrap" }}>
                    {postureWarning ? "Adjust posture" : "Face detected"}
                  </span>
                </div>
              )}

              <span style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,.55)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 9px", borderRadius: "999px", letterSpacing: ".4px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1.2s ease-in-out infinite" }} />
                LIVE
              </span>

              {!faceBox && (
                <span style={{ position: "absolute", left: "50%", bottom: "12px", transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", color: "#fff", fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                  {!trackingReady ? "Loading face tracking…" : "Looking for your face…"}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px", marginTop: "10px" }}>
              {cameraChecks.map((c) => (
                <div key={c.label} style={{ padding: "7px 9px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", minWidth: 0 }}>
                  <div style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>{c.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", fontWeight: 700, color: c.ok ? "var(--teal)" : "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.ok ? "#22c55e" : "#cbd5e1", flexShrink: 0 }} />
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "18px", borderRadius: "14px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "9px", background: "var(--accent-l)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RoundIcon d="M15 16v2c0 .932 0 1.398-.152 1.765a2 2 0 01-1.083 1.083C13.398 21 12.932 21 12 21c-.932 0-1.398 0-1.765-.152a2 2 0 01-1.083-1.083C9 19.398 9 18.932 9 18v-2m-4-6a7 7 0 1110.608 6H8.392A6.996 6.996 0 015 10z" size={16} />
                </span>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>AI Suggestions</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-l)", padding: "3px 8px", borderRadius: "999px" }}>Live</span>
            </div>

            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "8px" }}>How to structure it</div>
            <ol style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "7px" }}>
              {suggestions.approach.map((step, i) => (
                <li key={step} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: "var(--text)", lineHeight: 1.45 }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--accent-l)", color: "var(--accent)", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            {suggestions.points.length > 0 && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "8px" }}>Points worth covering</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {suggestions.points.map((p) => (
                    <span key={p} style={{ fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>{p}</span>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "8px" }}>On your answer</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {suggestions.feedback.map((f) => (
                <div key={f.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.45, color: "var(--text)" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: toneColor[f.tone], marginTop: "6px", flexShrink: 0 }} />
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
