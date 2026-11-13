import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type ExplainInput = {
  question: string;
  options: string[];
  correct: string;
  data_presentation?: string;
  /** Present when the question bank already carries one — then nothing is fetched. */
  explanation?: string;
};

export type ExplanationState =
  | { status: "ready"; text: string; disputed: boolean; suggestedAnswer: string | null; ai: boolean }
  | { status: "loading" }
  | { status: "failed" };

type ApiExplanation = { text: string | null; disputed: boolean; suggested_answer: string | null };

const BATCH = 20; // the API's per-call ceiling

/**
 * Explanations for a finished practice session. Questions that ship with one
 * use it as-is; the rest are explained by the AI service through
 * POST /ai/explain-questions (cached server-side, so repeat questions are
 * instant). One failed batch doesn't affect the others, and retry() re-asks
 * only for what's still missing.
 */
export function useQuestionExplanations(items: ExplainInput[]) {
  const bundled = (list: ExplainInput[]) => {
    const initial: Record<number, ExplanationState> = {};
    list.forEach((it, i) => {
      if (it.explanation) initial[i] = { status: "ready", text: it.explanation, disputed: false, suggestedAnswer: null, ai: false };
    });
    return initial;
  };
  const [state, setState] = useState<Record<number, ExplanationState>>(() => bundled(items));
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // Bumped whenever the question set changes (e.g. a retake) so a slow response
  // for the OLD questions can never land on the new ones.
  const generation = useRef(0);

  const fetchFor = useCallback(async (indices: number[]) => {
    if (indices.length === 0) return;
    const gen = generation.current;
    setState((prev) => ({ ...prev, ...Object.fromEntries(indices.map((i) => [i, { status: "loading" } as ExplanationState])) }));
    const chunks: number[][] = [];
    for (let start = 0; start < indices.length; start += BATCH) chunks.push(indices.slice(start, start + BATCH));
    // Batches run in parallel: they're independent, and the AI call is the slow part.
    await Promise.all(chunks.map(async (chunk) => {
      try {
        const res = await api.post<{ explanations: ApiExplanation[] }>("/ai/explain-questions", {
          questions: chunk.map((i) => {
            const it = itemsRef.current[i];
            return { question: it.question, options: it.options, correct_answer: it.correct, data_presentation: it.data_presentation || undefined };
          }),
        }, { timeout: 60_000 });
        if (gen !== generation.current) return;
        const list = res.data?.explanations ?? [];
        setState((prev) => {
          const next = { ...prev };
          chunk.forEach((idx, n) => {
            const e = list[n];
            next[idx] = e?.text
              ? { status: "ready", text: e.text, disputed: e.disputed, suggestedAnswer: e.suggested_answer, ai: true }
              : { status: "failed" };
          });
          return next;
        });
      } catch (err) {
        console.error("Failed to load explanations", err);
        if (gen !== generation.current) return;
        setState((prev) => ({ ...prev, ...Object.fromEntries(chunk.map((i) => [i, { status: "failed" } as ExplanationState])) }));
      }
    }));
  }, []);

  // Starts as soon as there are questions — pass the questions while the
  // student is still answering so the explanations are ready by the time they
  // finish. An empty list does nothing; a different question set restarts.
  const signature = items.map((it) => `${it.question}${it.correct}`).join("");
  useEffect(() => {
    generation.current += 1;
    const list = itemsRef.current;
    setState(bundled(list));
    if (list.length === 0) return;
    fetchFor(list.map((it, i) => (it.explanation ? -1 : i)).filter((i) => i >= 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, fetchFor]);

  const retry = useCallback(() => {
    const missing = itemsRef.current.map((_, i) => i).filter((i) => !itemsRef.current[i].explanation && state[i]?.status !== "ready" && state[i]?.status !== "loading");
    fetchFor(missing);
  }, [fetchFor, state]);

  return { explanations: state, retry };
}
