import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { useQuestionExplanations, type ExplainInput } from "./useQuestionExplanations";

const item = (n: number, extra: Partial<ExplainInput> = {}): ExplainInput => ({ question: `Q${n}`, options: ["a", "b", "c", "d"], correct: "b", ...extra });

describe("useQuestionExplanations", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("uses bundled explanations without calling the API", () => {
    const { result } = renderHook(() => useQuestionExplanations([item(1, { explanation: "Because." })]));
    expect(result.current.explanations[0]).toMatchObject({ status: "ready", text: "Because.", ai: false });
    expect(post).not.toHaveBeenCalled();
  });

  it("fetches missing explanations in one request and fills them in order", async () => {
    post.mockResolvedValue({ data: { explanations: [{ text: "First", disputed: false, suggested_answer: null }, { text: "Second", disputed: true, suggested_answer: "c" }] } });
    const items = [item(1), item(2)];
    const { result } = renderHook(() => useQuestionExplanations(items));
    expect(result.current.explanations[0]).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current.explanations[1]?.status).toBe("ready"));
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe("/ai/explain-questions");
    expect(post.mock.calls[0][1].questions.map((q: { question: string }) => q.question)).toEqual(["Q1", "Q2"]);
    expect(result.current.explanations[0]).toMatchObject({ text: "First", ai: true });
    expect(result.current.explanations[1]).toMatchObject({ text: "Second", disputed: true, suggestedAnswer: "c" });
  });

  it("splits large sessions into batches of 20", async () => {
    post.mockImplementation((_url: string, body: { questions: unknown[] }) => Promise.resolve({ data: { explanations: body.questions.map(() => ({ text: "x", disputed: false, suggested_answer: null })) } }));
    const items = Array.from({ length: 25 }, (_, i) => item(i));
    const { result } = renderHook(() => useQuestionExplanations(items));
    await waitFor(() => expect(result.current.explanations[24]?.status).toBe("ready"));
    expect(post.mock.calls.map((c) => c[1].questions.length)).toEqual([20, 5]);
  });

  it("marks failures and retries only what is still missing", async () => {
    post.mockRejectedValueOnce(new Error("boom"));
    const items = [item(1, { explanation: "Have one" }), item(2)];
    const { result } = renderHook(() => useQuestionExplanations(items));
    await waitFor(() => expect(result.current.explanations[1]?.status).toBe("failed"));
    expect(result.current.explanations[0]).toMatchObject({ status: "ready" });

    post.mockResolvedValueOnce({ data: { explanations: [{ text: "Now it works", disputed: false, suggested_answer: null }] } });
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.explanations[1]).toMatchObject({ status: "ready", text: "Now it works" }));
    expect(post.mock.calls[1][1].questions).toHaveLength(1);
  });

  it("treats an empty explanation from the server as a failure the student can retry", async () => {
    post.mockResolvedValue({ data: { explanations: [{ text: null, disputed: false, suggested_answer: null }] } });
    const { result } = renderHook(() => useQuestionExplanations([item(1)]));
    await waitFor(() => expect(result.current.explanations[0]?.status).toBe("failed"));
  });
});
