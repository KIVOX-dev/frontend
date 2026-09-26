"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const RELOAD_KEY = "ts_legacy_reload";

/**
 * Rendered by every layout that imports legacy-shell.css (the old dashboard
 * stylesheet), so the guard below can tell those pages apart without a
 * hard-coded list of routes shipping in the client bundle.
 */
export function LegacyRouteMarker() {
  return <span data-legacy-route hidden />;
}

// The loaded stylesheet(s) holding legacy-shell.css, found by the
// --legacy-shell marker that file defines.
function legacySheets() {
  return Array.from(document.styleSheets).filter((sheet) => {
    try {
      return Array.from(sheet.cssRules).some((rule) => rule.cssText.includes("--legacy-shell"));
    } catch {
      return false; // cross-origin sheet: not ours
    }
  });
}

// Portal stylesheet on for portal pages, off everywhere else.
function sync() {
  const onPortal = !!document.querySelector("[data-legacy-route]");
  legacySheets().forEach((s) => (s.disabled = !onPortal));
  if (onPortal) return;

  // Fallback, only if the stylesheet couldn't be switched off: reload so the
  // page loads without it. Guarded per path, so a reload that didn't help
  // can't loop, but a later visit from a portal still gets fixed.
  const leaked = getComputedStyle(document.documentElement).getPropertyValue("--legacy-shell").trim() !== "";
  try {
    if (!leaked) return sessionStorage.removeItem(RELOAD_KEY);
    if (sessionStorage.getItem(RELOAD_KEY) === location.pathname) return;
    sessionStorage.setItem(RELOAD_KEY, location.pathname);
  } catch {
    if (!leaked) return;
  }
  document.documentElement.style.visibility = "hidden";
  window.location.reload();
}

/**
 * Next.js never unloads a route's CSS after client-side navigation, so once
 * a portal has been opened its global rules (html/body overflow:hidden,
 * .hero, .screen, .card, ...) would stay on the page and break the landing
 * and legal pages. This switches that stylesheet off on non-portal pages and
 * back on for portal pages: instant, no reload.
 *
 * Checked on every navigation (layout effect: new page in the DOM, not yet
 * painted) and whenever the portal marker appears or disappears, since a
 * route can render a loading screen first and its layout a moment later.
 */
export function LegacyStyleGuard() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    sync();
  }, [pathname]);

  useLayoutEffect(() => {
    let last = !!document.querySelector("[data-legacy-route]");
    const observer = new MutationObserver(() => {
      const now = !!document.querySelector("[data-legacy-route]");
      if (now === last) return;
      last = now;
      sync();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
