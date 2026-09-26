"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const RELOAD_KEY = "ts_legacy_reload_at";

/**
 * Rendered by every layout that imports legacy-shell.css (the old dashboard
 * stylesheet), so the guard below can tell those pages apart without a
 * hard-coded list of routes shipping in the client bundle.
 */
export function LegacyRouteMarker() {
  return <span data-legacy-route hidden />;
}

/**
 * Next.js never unloads a route's CSS after client-side navigation, so once
 * a portal has been opened its global rules (html/body overflow:hidden,
 * .hero, .screen, .card, ...) stay on the page. Landing on a non-portal page
 * with them still loaded freezes scrolling and restyles its components.
 * When that happens, reload once: a fresh document only loads this page's
 * own CSS. legacy-shell.css sets the --legacy-shell marker this reads.
 */
export function LegacyStyleGuard() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Effects run after the page's own layout has rendered its marker.
    if (document.querySelector("[data-legacy-route]")) return;
    const leaked = getComputedStyle(document.documentElement).getPropertyValue("--legacy-shell").trim() !== "";
    if (!leaked) return;
    // At most once a minute, so a page that legitimately loads the legacy
    // CSS but forgot its marker can't reload in a loop.
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      // Storage blocked: one reload is still safe.
    }
    // Hide the half-styled page for the moment before the reload lands.
    document.documentElement.style.visibility = "hidden";
    window.location.reload();
  }, [pathname]);

  return null;
}
