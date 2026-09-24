// Shared between the main thread (proctoring.ts) and the background worker
// (deviceDetector.worker.ts). Kept free of the Worker-spawning code so the
// worker bundle doesn't try to bundle a worker inside itself.

export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export const OBJECT_MODEL_LITE0_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";
export const OBJECT_MODEL_LITE2_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite";

// A conservative subset of the model's 80 COCO classes — deliberately
// excludes "keyboard"/"mouse"/"book" etc., which the camera routinely sees as
// part of the student's OWN normal setup and would false-positive constantly.
export const DEVICE_CLASSES = ["cell phone", "laptop", "tv", "remote"];

export type DeviceThresholds = { phone: number; other: number };

// Lite2 (run in the worker) separates a phone in the hand from an empty hand
// far better than Lite0: on the same frame, Lite0 scored an open raised hand
// 0.305 as "cell phone" while Lite2 reported nothing at all, so Lite2 can
// afford a lower phone bar and catch phones that are tilted or half-covered.
export const LITE2_THRESHOLDS: DeviceThresholds = { phone: 0.3, other: 0.4 };
// Main-thread fallback only (browsers that can't run the worker). Lite0
// can't go below 0.4 for phones without flagging hands.
export const LITE0_THRESHOLDS: DeviceThresholds = { phone: 0.4, other: 0.4 };

type DetectionLike = { categories: { categoryName: string; score: number }[] };

export function detectsExternalDevice(result: { detections: DetectionLike[] }, thresholds: DeviceThresholds = LITE0_THRESHOLDS): boolean {
  return result.detections.some((d) =>
    d.categories.some((c) =>
      c.categoryName === "cell phone"
        ? c.score >= thresholds.phone
        : DEVICE_CLASSES.includes(c.categoryName) && c.score >= thresholds.other
    )
  );
}
