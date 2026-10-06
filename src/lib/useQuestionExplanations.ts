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
  const [state, setState] = useState<Record<number, ExplanationState>>(() => {
    const initial: Record<number, ExplanationState> = {};
    items.forEach((it, i) => {
      if (it.explanation) initial[i] = { status: "ready", text: it.explanation, disputed: false, suggestedAnswer: null, ai: false };
    });
    return initial;
  });
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const started = useRef(false);

  const fetchFor = useCallback(async (indices: number[]) => {
    if (indices.length === 0) return;
    setState((prev) => ({ ...prev, ...Object.fromEntries(indices.map((i) => [i, { status: "loading" } as ExplanationState])) }));
    for (let start = 0; start < indices.length; start += BATCH) {
      const chunk = indices.slice(start, start + BATCH);
      try {
        const res = await api.post<{ explanations: ApiExplanation[] }>("/ai/explain-questions", {
          questions: chunk.map((i) => {
            const it = itemsRef.current[i];
            return { question: it.question, options: it.options, correct_answer: it.correct, data_presentation: it.data_presentation || undefined };
          }),
        }, { timeout: 60_000 });
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
        setState((prev) => ({ ...prev, ...Object.fromEntries(chunk.map((i) => [i, { status: "failed" } as ExplanationState])) }));
      }
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetchFor(items.map((it, i) => (it.explanation ? -1 : i)).filter((i) => i >= 0));
  }, [items, fetchFor]);

  const retry = useCallback(() => {
    const missing = itemsRef.current.map((_, i) => i).filter((i) => !itemsRef.current[i].explanation && state[i]?.status !== "ready");
    fetchFor(missing);
  }, [fetchFor, state]);

  return { explanations: state, retry };
}
