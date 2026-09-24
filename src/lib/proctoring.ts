import {
  FaceDetector,
  FilesetResolver,
  ObjectDetector,
  PoseLandmarker,
  type FaceDetectorResult,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import {
  DEVICE_CLASSES,
  LITE0_THRESHOLDS,
  MEDIAPIPE_WASM_URL,
  OBJECT_MODEL_LITE0_URL,
  detectsExternalDevice,
} from "./deviceDetection";

// Shared camera-proctoring building blocks for the Mock Interviewer and the
// YouTube-course assessment window. Models load from Google's model store and
// jsdelivr at runtime (both allow-listed in next.config.mjs's CSP), not
// bundled — CPU delegate, since the WebGL one fails silently on many VMs /
// remote-desktop sessions.
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/** Detection cadence. Running the models on every animation frame on the CPU
 *  pegs the main thread (laggy typing, and late detections because each frame
 *  queues behind the last); fixed intervals keep the page smooth. The device
 *  check runs in a worker and simply starts again as soon as the last one
 *  finishes, at most every OBJECT_INTERVAL_MS. */
export const POSE_INTERVAL_MS = 120;
export const OBJECT_INTERVAL_MS = 250;

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

export type DeviceDetector = {
  /** Checks the current frame for a phone/laptop/TV/remote unless a check is
   *  already in flight. Resolves to whether one was seen; returns null when
   *  skipped (busy, or no frame yet). Never blocks the calling frame. */
  check(video: HTMLVideoElement): Promise<boolean> | null;
  close(): void;
};

/** Device detection: EfficientDet-Lite2 in a background worker, falling back
 *  to Lite0 on the main thread if workers/ImageBitmap aren't available. */
export async function createDeviceDetector(): Promise<DeviceDetector> {
  try {
    return await createWorkerDeviceDetector();
  } catch (err) {
    console.warn("Device-detection worker unavailable, falling back to the main thread:", err);
  }
  const fileset = await loadFileset();
  const detector = await ObjectDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: OBJECT_MODEL_LITE0_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    scoreThreshold: LITE0_THRESHOLDS.phone,
    maxResults: 10,
    // Only the four device classes are post-processed and returned.
    categoryAllowlist: DEVICE_CLASSES,
  });
  let lastTimestamp = 0;
  return {
    check(video) {
      // VIDEO mode needs strictly increasing timestamps.
      const ts = Math.max(performance.now(), lastTimestamp + 1);
      lastTimestamp = ts;
      return Promise.resolve(detectsExternalDevice(detector.detectForVideo(video, ts), LITE0_THRESHOLDS));
    },
    close() {
      detector.close();
    },
  };
}

function createWorkerDeviceDetector(): Promise<DeviceDetector> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined" || typeof createImageBitmap === "undefined") {
      reject(new Error("Worker or createImageBitmap not supported"));
      return;
    }
    const worker = new Worker(new URL("./deviceDetector.worker.ts", import.meta.url));
    let ready = false;
    let dead = false;
    let pending: ((hit: boolean) => void) | null = null;

    const fail = (message: string) => {
      dead = true;
      worker.terminate();
      if (!ready) reject(new Error(message));
      pending?.(false);
      pending = null;
    };

    worker.onmessage = (event: MessageEvent<{ type: string; hit?: boolean; message?: string }>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        ready = true;
        resolve(api);
      } else if (msg.type === "result") {
        const done = pending;
        pending = null;
        done?.(Boolean(msg.hit));
      } else if (msg.type === "error") {
        fail(msg.message || "Device-detection worker error");
      }
    };
    worker.onerror = (event) => fail(event.message || "Device-detection worker crashed");

    const api: DeviceDetector = {
      check(video) {
        if (dead || pending || !video.videoWidth) return null;
        return new Promise<boolean>((done) => {
          pending = done;
          createImageBitmap(video)
            .then((bitmap) => worker.postMessage({ type: "detect", bitmap }, [bitmap]))
            .catch(() => {
              pending = null;
              done(false);
            });
        });
      },
      close() {
        dead = true;
        pending = null;
        worker.terminate();
      },
    };

    worker.postMessage({ type: "init" });
  });
}

/** BlazeFace short-range: an actual face detector, unlike pose landmarks —
 *  it finds no face when one is covered by a hand or cropped out of frame,
 *  where BlazePose still extrapolates confident-looking face points. */
export async function createFaceDetector(): Promise<FaceDetector> {
  const fileset = await loadFileset();
  return FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.6,
  });
}

export const FACE_INTERVAL_MS = 150;

/** Normalized [0,1] box of the most confident face, or null when none. */
export function primaryFace(result: FaceDetectorResult, frameWidth: number, frameHeight: number): { x: number; y: number; w: number; h: number } | null {
  let best: FaceDetectorResult["detections"][number] | null = null;
  for (const d of result.detections) {
    if (!best || (d.categories[0]?.score ?? 0) > (best.categories[0]?.score ?? 0)) best = d;
  }
  const b = best?.boundingBox;
  if (!b || !frameWidth || !frameHeight) return null;
  return { x: b.originX / frameWidth, y: b.originY / frameHeight, w: b.width / frameWidth, h: b.height / frameHeight };
}

/** Rolling vote over the last `window` detector runs: true once `needed` of
 *  them saw a device. A phone held in the hand flickers in and out of
 *  detection frame to frame, so "N in a row" kept resetting and never fired. */
export function createDeviceVoter(window = 5, needed = 3) {
  const history: boolean[] = [];
  return {
    push(hit: boolean): boolean {
      history.push(hit);
      if (history.length > window) history.shift();
      return history.filter(Boolean).length >= needed;
    },
    reset() {
      history.length = 0;
    },
  };
}

export async function createPoseLandmarker(numPoses: number): Promise<PoseLandmarker> {
  const fileset = await loadFileset();
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses,
  });
}

/** How long someone may be out of the camera's view before the test is stopped. */
export const ABSENT_LIMIT_MS = 5000;
/** Out of view this long before the countdown is shown — ignores a blink of
 *  missed frames. */
export const ABSENT_COUNTDOWN_AFTER_MS = 500;

// Nose (0) plus both eye centers (2, 5) in BlazePose's 33-point layout —
// corroborating landmarks for "the face is actually in frame". A lone nose
// visibility score isn't reliable proof by itself: BlazePose still
// extrapolates a confident-looking nose position from shoulder/torso cues
// even when the face itself is cropped out of the video (camera angled at
// the chest, held too low, etc.), which was reporting "Face: In view" with
// no face on screen and, since the absence countdown only starts once
// isPersonAbsent is true, silently suppressing the "missing" warning too.
const FACE_CONFIRM_LANDMARKS = [0, 2, 5];

/** True when nobody is in view or the face isn't visible (turned away, covered,
 *  camera blocked, or out of frame). Pose landmarks always come back for a
 *  detected person, so "absent" is either no pose at all or the face's
 *  confirming landmarks not all being visible and inside the frame. */
export function isPersonAbsent(result: PoseLandmarkerResult): boolean {
  const lm = result.landmarks[0];
  if (!lm) return true;
  return !FACE_CONFIRM_LANDMARKS.every((i) => {
    const p = lm[i];
    return p && (p.visibility ?? 0) >= 0.5 && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  });
}
