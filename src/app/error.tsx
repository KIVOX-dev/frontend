"use client";

import { useEffect } from "react";

const RELOAD_KEY = "ts_chunk_reload_at";

// A tab opened before a deploy still runs the old build; navigating then asks
// for script chunks the new deployment no longer serves. A fresh document
// loads the new build, so reload — at most once a minute, in case the chunk
// is genuinely broken rather than stale.
function isStaleChunk(error: Error) {
  return error.name === "ChunkLoadError" || /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module/i.test(error.message);
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked: still worth one reload, there's no loop risk beyond it.
  }
  window.location.reload();
  return true;
}

/** Route-level error boundary: without one, any client exception is Next's bare "Application error" screen. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const reloading = isStaleChunk(error);

  useEffect(() => {
    console.error(error);
    if (reloading) reloadOnce();
  }, [error, reloading]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-paper text-ink">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">{reloading ? "Loading the latest version…" : "Something went wrong"}</h1>
        <p className="text-ink-muted mb-6">
          {reloading
            ? "TalentSnaps was updated while this tab was open."
            : "This page hit an unexpected error. Try again, or reload the page."}
        </p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={reset} className="h-10 px-4 rounded-lg border border-line font-semibold">
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="h-10 px-4 rounded-lg bg-ink text-white font-semibold">
            Reload page
          </button>
        </div>
      </div>
    </main>
  );
}
