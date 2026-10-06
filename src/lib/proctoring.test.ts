import { describe, expect, it, vi } from "vitest";

// proctoring.ts imports MediaPipe at module load; only the pure helpers are under test.
vi.mock("@mediapipe/tasks-vision", () => ({ FaceDetector: {}, FilesetResolver: {}, ObjectDetector: {}, PoseLandmarker: {} }));

import { countFaces, createDeviceVoter, primaryFace } from "./proctoring";

const det = (score: number, width: number) => ({ categories: [{ score }], boundingBox: { originX: 0, originY: 0, width, height: width } });
const result = (...d: ReturnType<typeof det>[]) => ({ detections: d }) as never;

describe("countFaces", () => {
  it("counts a second, further-back face", () => {
    expect(countFaces(result(det(0.9, 200), det(0.55, 70)), 640)).toBe(2);
  });
  it("ignores specks and low-confidence blobs", () => {
    expect(countFaces(result(det(0.9, 200), det(0.9, 10), det(0.3, 120)), 640)).toBe(1);
  });
  it("is zero for an empty frame", () => {
    expect(countFaces(result(), 640)).toBe(0);
  });
});

describe("primaryFace", () => {
  it("only treats a confident detection as the candidate's face", () => {
    expect(primaryFace(result(det(0.55, 100)), 640, 480)).toBeNull();
    expect(primaryFace(result(det(0.55, 100), det(0.9, 150)), 640, 480)?.w).toBeCloseTo(150 / 640);
  });
});

describe("multi-face voting", () => {
  it("needs 3 of the last 5 checks, so one flickery frame does not end the session", () => {
    const v = createDeviceVoter(5, 3);
    expect([true, false, false, true, false].map((x) => v.push(x)).at(-1)).toBe(false);
    v.reset();
    expect([true, true, false, true].map((x) => v.push(x)).at(-1)).toBe(true);
  });
});
