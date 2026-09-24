import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";
import {
  DEVICE_CLASSES,
  LITE2_THRESHOLDS,
  MEDIAPIPE_WASM_URL,
  OBJECT_MODEL_LITE2_URL,
  detectsExternalDevice,
} from "./deviceDetection";

// Runs EfficientDet-Lite2 off the main thread: at ~0.6s per frame on a
// typical laptop CPU it would freeze typing if run on the page itself.
// Messages in:  { type: "init" } | { type: "detect", bitmap: ImageBitmap }
// Messages out: { type: "ready" } | { type: "result", hit: boolean } | { type: "error", message: string }

const ctx = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
};

let detector: ObjectDetector | null = null;

ctx.onmessage = async (event: MessageEvent) => {
  const msg = event.data as { type: "init" } | { type: "detect"; bitmap: ImageBitmap };

  if (msg.type === "init") {
    try {
      const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      detector = await ObjectDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: OBJECT_MODEL_LITE2_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        scoreThreshold: Math.min(LITE2_THRESHOLDS.phone, LITE2_THRESHOLDS.other),
        maxResults: 10,
        categoryAllowlist: DEVICE_CLASSES,
      });
      ctx.postMessage({ type: "ready" });
    } catch (err) {
      ctx.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  const { bitmap } = msg;
  try {
    const hit = detector ? detectsExternalDevice(detector.detect(bitmap), LITE2_THRESHOLDS) : false;
    ctx.postMessage({ type: "result", hit });
  } catch (err) {
    ctx.postMessage({ type: "error", message: String(err) });
  } finally {
    bitmap.close();
  }
};
