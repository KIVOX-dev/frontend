import { useEffect, useRef, useState, useCallback } from "react";

type Options = {
  /** ms to wait after the query stops changing before firing. */
  delay?: number;
  /** Below this length, don't fetch at all (and clear any pending timer). */
  minLength?: number;
};

/**
 * Debounces `query` and fires `fetcher(query, signal)` once it settles.
 *
 * Race-condition safety: each firing aborts the previous in-flight request
 * (via AbortController) before starting the next, so a fast typist can never
 * have an older, slower response overwrite a newer one — and any request
 * still in flight when the component unmounts is aborted rather than
 * resolving into a set-state-after-unmount no-op.
 *
 * `fetcher` is read through a ref, not a dependency — callers don't need to
 * wrap it in useCallback for this to behave correctly.
 */
export function useDebouncedSearch<T>(
  query: string,
  fetcher: (query: string, signal: AbortSignal) => Promise<T>,
  { delay = 400, minLength = 0 }: Options = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback((q: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    fetcherRef
      .current(q, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        const isCancel = err?.name === "CanceledError" || err?.code === "ERR_CANCELED" || err?.name === "AbortError";
        if (!controller.signal.aborted && !isCancel) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (query.length < minLength) {
      controllerRef.current?.abort();
      setLoading(false);
      return undefined;
    }
    const timer = setTimeout(() => run(query), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, delay, minLength]);

  // Cancel any in-flight request on unmount.
  useEffect(() => () => controllerRef.current?.abort(), []);

  /** Bypass the debounce and fetch immediately — e.g. an explicit "Search" button / Enter key. */
  const runNow = useCallback(() => run(query), [run, query]);

  return { data, loading, error, runNow };
}
