import {
  FilesetResolver,
  ObjectDetector,
  PoseLandmarker,
  type ObjectDetectorResult,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

// Shared camera-proctoring building blocks for the Mock Interviewer and the
// YouTube-course assessment window. Models load from Google's model store and
// jsdelivr at runtime (both allow-listed in next.config.mjs's CSP), not
// bundled — CPU delegate, since the WebGL one fails silently on many VMs /
// remote-desktop sessions.
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const OBJECT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// A conservative subset of the model's 80 COCO classes — deliberately
// excludes "keyboard"/"mouse"/"book" etc., which the camera routinely sees as
// part of the student's OWN normal setup and would false-positive constantly.
const DEVICE_CLASSES = ["cell phone", "laptop", "tv", "remote"];

// EfficientDet-Lite0 rarely scores a phone held at an angle above 0.5, so a
// 0.5 cut-off missed real phones; 0.4 catches them while the two-hit
// confirmation below keeps a single misread frame from ending a test.
const DEVICE_SCORE_THRESHOLD = 0.4;

/** Detection cadence. Running both models on every animation frame on the CPU
 *  pegs the main thread (laggy typing, and late detections because each frame
 *  queues behind the last); fixed intervals keep the page smooth and detection
 *  latency at roughly a quarter second. */
export const POSE_INTERVAL_MS = 120;
export const OBJECT_INTERVAL_MS = 250;
/** Consecutive object-detector runs that must all see a device (~0.5s). */
export const DEVICE_CONFIRM_HITS = 2;

// The WASM runtime is fetched once and shared by every model on the page,
// instead of once per model. A failed load isn't cached, so a retry works.
let filesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;
function loadFileset() {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL).catch((err) => {
      filesetPromise = null;
      throw err;
    });
  }
  return filesetPromise;
}

export async function createObjectDetector(): Promise<ObjectDetector> {
  const fileset = await loadFileset();
  return ObjectDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: OBJECT_MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    scoreThreshold: DEVICE_SCORE_THRESHOLD,
    maxResults: 10,
    // Only the four device classes are post-processed and returned.
    categoryAllowlist: DEVICE_CLASSES,
  });
}

export async function createPoseLandmarker(numPoses: number): Promise<PoseLandmarker> {
  const fileset = await loadFileset();
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses,
  });
}

export function detectsExternalDevice(result: ObjectDetectorResult): boolean {
  return result.detections.some((d) =>
    d.categories.some((c) => DEVICE_CLASSES.includes(c.categoryName) && c.score >= DEVICE_SCORE_THRESHOLD)
  );
}

/** How long someone may be out of the camera's view before the test is stopped. */
export const ABSENT_LIMIT_MS = 5000;
/** Out of view this long before the countdown is shown — ignores a blink of
 *  missed frames. */
export const ABSENT_COUNTDOWN_AFTER_MS = 500;

/** True when nobody is in view or the face isn't visible (turned away, covered,
 *  camera blocked). Pose landmarks always come back for a detected person, so
 *  "absent" is either no pose at all or a low-visibility nose. */
export function isPersonAbsent(result: PoseLandmarkerResult): boolean {
  const lm = result.landmarks[0];
  if (!lm) return true;
  return (lm[0]?.visibility ?? 0) < 0.5;
}
