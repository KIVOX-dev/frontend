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
 *  queues behind the last); fixed intervals keep the page smooth. See
 *  createDeviceWatch for how device detection is scheduled. */
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

export type DeviceWatch = {
  /** Call once per animation frame. Runs the on-page Lite0 check when it's
   *  due (every OBJECT_INTERVAL_MS — this blocks ~100-200ms, so returns true
   *  to let the caller skip its other models this frame) and keeps the
   *  background Lite2 worker busy. Every result, from either source, goes to
   *  the onResult callback: true/false, or null when a check failed. */
  tick(video: HTMLVideoElement, nowMs: number): boolean;
  close(): void;
};

// A worker check normally returns in about a second; one that hasn't after
// this long has hung, and the worker is dropped (the on-page check carries on).
const WORKER_CHECK_TIMEOUT_MS = 5000;

/** Phone/laptop/TV/remote detection from two sources feeding one callback:
 *
 *  1. Primary — EfficientDet-Lite0 on the page, every OBJECT_INTERVAL_MS.
 *     This is the original, proven path: fast, and it works anywhere the
 *     face/pose models work.
 *  2. Bonus — EfficientDet-Lite2 in a background worker, which catches
 *     harder cases (tilted, half-covered, at the frame edge) but is slow and
 *     depends on a WebGL context inside the worker, which fails on some
 *     machines. When it fails or hangs it's simply dropped — detection never
 *     depends on it. */
export async function createDeviceWatch(onResult: (hit: boolean | null) => void): Promise<DeviceWatch> {
  // The page detector is what detection relies on, so it doesn't wait for the
  // worker's larger model to download; the worker joins whenever it's ready.
  const workerLoad = createWorkerDetector();
  let worker: WorkerDetector | null = null;
  let closed = false;
  let page: ObjectDetector | null = null;
  try {
    page = await createPageDetector();
  } catch (err) {
    console.error("Device detection: on-page detector failed to load.", err);
  }
  if (page) {
    workerLoad.then(
      (w) => {
        if (closed) w.close();
        else worker = w;
      },
      (err) => console.warn("Device detection: background worker unavailable.", err)
    );
  } else {
    try {
      worker = await workerLoad;
    } catch (err) {
      throw new Error(`No device detector could be loaded: ${String(err)}`);
    }
  }

  let lastPageRun = 0;
  let pageTimestamp = 0;
  let pageErrorLogged = false;
  let workerBusy = false;

  const dropWorker = (reason: unknown) => {
    console.warn("Device detection: background worker stopped; continuing with the on-page detector.", reason);
    worker?.close();
    worker = null;
    workerBusy = false;
  };

  return {
    tick(video, nowMs) {
      if (worker && !workerBusy && video.videoWidth) {
        const pending = worker.check(video);
        workerBusy = true;
        const current = worker;
        const timer = setTimeout(() => {
          if (worker === current) dropWorker(new Error("Device check timed out"));
        }, WORKER_CHECK_TIMEOUT_MS);
        pending.then(
          (hit) => {
            clearTimeout(timer);
            if (worker !== current) return;
            workerBusy = false;
            onResult(hit);
          },
          (err) => {
            clearTimeout(timer);
            if (worker === current) dropWorker(err);
          }
        );
      }

      if (!page || nowMs - lastPageRun < OBJECT_INTERVAL_MS) return false;
      lastPageRun = nowMs;
      // VIDEO mode needs strictly increasing timestamps.
      pageTimestamp = Math.max(nowMs, pageTimestamp + 1);
      try {
        onResult(detectsExternalDevice(page.detectForVideo(video, pageTimestamp), LITE0_THRESHOLDS));
      } catch (err) {
        if (!pageErrorLogged) console.error("Device detection: on-page check failed.", err);
        pageErrorLogged = true;
        onResult(null);
      }
      return true;
    },
    close() {
      closed = true;
      page?.close();
      worker?.close();
      worker = null;
    },
  };
}

async function createPageDetector(): Promise<ObjectDetector> {
  const fileset = await loadFileset();
  return ObjectDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: OBJECT_MODEL_LITE0_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    scoreThreshold: LITE0_THRESHOLDS.phone,
    maxResults: 10,
    // Only the four device classes are post-processed and returned.
    categoryAllowlist: DEVICE_CLASSES,
  });
}

type WorkerDetector = {
  /** Rejects if the worker errors. */
  check(video: HTMLVideoElement): Promise<boolean>;
  close(): void;
};

function createWorkerDetector(): Promise<WorkerDetector> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined" || typeof createImageBitmap === "undefined") {
      reject(new Error("Worker or createImageBitmap not supported"));
      return;
    }
    const worker = new Worker(new URL("./deviceDetector.worker.ts", import.meta.url));
    let ready = false;
    let pending: { resolve: (hit: boolean) => void; reject: (err: Error) => void } | null = null;

    const fail = (message: string) => {
      worker.terminate();
      const err = new Error(message);
      if (!ready) reject(err);
      pending?.reject(err);
      pending = null;
    };

    worker.onmessage = (event: MessageEvent<{ type: string; hit?: boolean; message?: string }>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        ready = true;
        resolve(detector);
      } else if (msg.type === "result") {
        const done = pending;
        pending = null;
        done?.resolve(Boolean(msg.hit));
      } else if (msg.type === "error") {
        fail(msg.message || "Device-detection worker error");
      }
    };
    worker.onerror = (event) => fail(event.message || "Device-detection worker crashed");

    const detector: WorkerDetector = {
      check(video) {
        return new Promise<boolean>((res, rej) => {
          pending = { resolve: res, reject: rej };
          createImageBitmap(video)
            .then((bitmap) => worker.postMessage({ type: "detect", bitmap }, [bitmap]))
            .catch((err) => {
              pending = null;
              rej(err instanceof Error ? err : new Error(String(err)));
            });
        });
      },
      close() {
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
 *  detection frame to frame, so "N in a row" kept resetting and never fired.
 *  Two hits (not one) so a single misread frame can't end a test; with the
 *  thresholds in deviceDetection.ts an empty hand scores no hits at all. */
export function createDeviceVoter(window = 4, needed = 2) {
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
