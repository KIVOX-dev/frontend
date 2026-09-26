"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUiStore } from "@/stores/uiStore";

// Readable URLs for every portal screen: /learner/aptitude-tests,
// /institutional/placement-drives, /hr/applicants, ...
//
// Screens are still switched through useUiStore's activeScreen (41 call
// sites depend on it); usePortalRoute() below just keeps the address bar and
// that state in step, so refresh, back/forward and shared links all land on
// the right screen. A screen missing from its portal's map (e.g. the
// lesson-assessment pop-up window) is left alone and keeps its own URL.

const SHARED: Record<string, string> = {
  dash: "dashboard",
  "profile-info": "profile",
  settings: "settings",
  "my-activity": "activity",
  chat: "messages",
  "search-results": "search",
};

const STUDENT: Record<string, string> = {
  ...SHARED,
  tests: "aptitude-tests",
  history: "test-history",
  learnings: "learnings",
  practice: "mock-practice",
  iv: "mock-interview",
  "youtube-course-import": "youtube-to-course",
  setup: "setup",
  placements: "placements",
  resume: "resume-builder",
  lb: "talent-board",
  subs: "subscription",
};

export const PORTAL_ROUTES = {
  learner: { base: "/learner", screens: STUDENT },
  institutional: {
    base: "/institutional",
    screens: {
      ...STUDENT,
      // College admin
      drives: "placement-drives",
      users: "manage-users",
      security: "approvals",
      assessments: "assessments",
      // Faculty (and admin)
      tracking: "student-tracking",
      "add-student": "add-student",
      upload: "upload-students",
    } as Record<string, string>,
  },
  hr: {
    base: "/hr",
    screens: {
      "hr-dash": "dashboard",
      "hr-vac": "post-vacancy",
      "hr-app": "applicants",
      "hr-lb": "talent-board",
      "hr-analytics": "analytics",
      "my-activity": "activity",
    } as Record<string, string>,
  },
} as const;

export type Portal = keyof typeof PORTAL_ROUTES;

/** The URL for a screen, e.g. screenHref("institutional", "drives") → "/institutional/placement-drives". */
export function screenHref(portal: Portal, screenId: string) {
  const { base, screens } = PORTAL_ROUTES[portal];
  const slug = screens[screenId];
  return slug ? `${base}/${slug}` : base;
}

// Old URLs for screens that were merged into another one.
const SLUG_ALIASES: Record<string, string> = {
  "mnc-test": "iv", // MNC Test is now Round 1 of the Mock Interviewer
};

function screenForSlug(portal: Portal, slug: string) {
  const alias = SLUG_ALIASES[slug];
  if (alias && PORTAL_ROUTES[portal].screens[alias]) return alias;
  const entry = Object.entries(PORTAL_ROUTES[portal].screens).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

/**
 * Two-way sync between the address bar and activeScreen for one portal.
 * Only runs while `enabled` (signed in to this portal), so the login screen
 * keeps whatever URL it was opened with and lands there after sign-in.
 */
export function usePortalRoute(portal: Portal, enabled: boolean) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeScreen = useUiStore((s) => s.activeScreen);
  // The screen the address bar currently shows.
  const shown = useRef<string | null>(null);
  const { base, screens } = PORTAL_ROUTES[portal];

  // URL → screen: first load, refresh, back/forward.
  useEffect(() => {
    if (!enabled) return;
    const slug = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1).split("/")[0] : "";
    const id = slug ? screenForSlug(portal, slug) : null;
    if (!id) return;
    // An old alias (e.g. /mnc-test): show the screen's current URL instead.
    if (screens[id] !== slug) window.history.replaceState(null, "", `${base}/${screens[id]}${window.location.search}`);
    shown.current = id;
    if (useUiStore.getState().activeScreen !== id) useUiStore.getState().setActiveScreen(id);
  }, [pathname, enabled, base, portal, screens]);

  // Screen → URL: sidebar clicks and every other setActiveScreen().
  useEffect(() => {
    if (!enabled) return;
    // Read fresh: the effect above may have just changed it this commit.
    const current = useUiStore.getState().activeScreen;
    const slug = screens[current];
    if (!slug) return;

    // Legacy ?screen=... links (OAuth return, top-bar search) are applied
    // by each portal page's own effect; wait until that has happened.
    const queryScreen = searchParams.get("screen");
    if (queryScreen && queryScreen !== current) return;
    if (current === shown.current && !queryScreen) return;

    const target = `${base}/${slug}`;
    // Keep the other params (?tab=, ?q=, OAuth result) only when this screen
    // came from the query itself; a normal screen change starts clean.
    const params = new URLSearchParams(queryScreen ? searchParams.toString() : "");
    params.delete("screen");
    const url = params.size ? `${target}?${params}` : target;

    // Replace rather than push when only tidying the URL (bare /learner, or a
    // ?screen= link), so Back doesn't step through the untidy version.
    const tidy = pathname === base || !!queryScreen;
    window.history[tidy ? "replaceState" : "pushState"](null, "", url);
    shown.current = current;
  }, [activeScreen, enabled, pathname, searchParams, base, screens]);
}
