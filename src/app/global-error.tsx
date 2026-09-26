"use client";

import { useEffect } from "react";
import { STALE_RELOAD_KEY } from "@/lib/staleBuild";

const isStaleChunk = (error: Error) =>
  error.name === "ChunkLoadError" || /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module/i.test(error.message);

/**
 * Last-resort boundary for errors app/error.tsx can't catch (it sits inside
 * the root layout; this replaces it). Without it any such error is Next's
 * bare "Application error" screen. Renders its own <html>/<body>, with plain
 * inline styles since the app's CSS may be exactly what failed to load.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = isStaleChunk(error);

  useEffect(() => {
    console.error(error);
    if (!stale) return;
    try {
      const last = Number(sessionStorage.getItem(STALE_RELOAD_KEY) || 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
    } catch {
      // Storage blocked: one reload is still safe.
    }
    window.location.reload();
  }, [error, stale]);

  const button = { height: 40, padding: "0 16px", borderRadius: 8, font: "600 14px/1 system-ui, sans-serif", cursor: "pointer" };
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#fff", color: "#111827", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>{stale ? "Loading the latest version…" : "Something went wrong"}</h1>
          <p style={{ color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
            {stale ? "TalentSnaps was updated while this page was open." : "This page hit an unexpected error. Try again, or reload the page."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button type="button" onClick={reset} style={{ ...button, background: "#fff", border: "1px solid #d1d5db", color: "#111827" }}>
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} style={{ ...button, background: "#111827", border: 0, color: "#fff" }}>
              Reload page
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
