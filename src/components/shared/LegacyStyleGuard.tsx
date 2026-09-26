"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// Routes whose layout imports legacy-shell.css (the old dashboard stylesheet).
const LEGACY_ROUTES = [
  "/learner",
  "/hr",
  "/institutional",
  "/faculty",
  "/superadmin",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const isLegacyRoute = (path: string) => LEGACY_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

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
    if (isLegacyRoute(pathname)) return;
    const leaked = getComputedStyle(document.documentElement).getPropertyValue("--legacy-shell").trim() !== "";
    if (!leaked) return;
    // Hide the half-styled page for the moment before the reload lands.
    document.documentElement.style.visibility = "hidden";
    window.location.reload();
  }, [pathname]);

  return null;
}
