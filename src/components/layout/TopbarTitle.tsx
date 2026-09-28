"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";

// Screens that aren't in any sidebar (reached from buttons, the profile menu
// or deep links) still need a name in the header.
const EXTRA_TITLES: Record<string, string> = {
  settings: "Settings",
  "my-activity": "My Activity",
  "search-results": "Search",
  subs: "Subscription",
  history: "Test History",
  practice: "Mock Practice",
  iv: "Mock Interviewer",
  chat: "Messages",
  "profile-info": "Profile",
  profile: "Profile",
  resume: "Resume Builder",
  lb: "Top Talent Board",
  placements: "Placements",
};

/**
 * Left side of every portal's top bar: a sidebar toggle (desktop; phones
 * use #mob-menu-btn's drawer instead) and the current page's name, in place
 * of the old search box.
 */
export function TopbarTitle({ titles }: { titles: Record<string, string> }) {
  const { activeScreen, toggleSidebar, isSidebarCollapsed } = useUiStore();
  const title = titles[activeScreen] ?? EXTRA_TITLES[activeScreen] ?? titles.dash ?? "Dashboard";

  return (
    <div className="tb-lead">
      <button
        type="button"
        className="tb-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isSidebarCollapsed}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <polyline points={isSidebarCollapsed ? "13 10 15 12 13 14" : "15 10 13 12 15 14"} />
        </svg>
      </button>
      <h1 className="tb-title">{title}</h1>
    </div>
  );
}

/** id → label for a shell's nav items, including grouped children. */
export function navTitles(items: { id: string; label: string; children?: { id: string; label: string }[] }[]) {
  const out: Record<string, string> = {};
  for (const item of items) {
    out[item.id] = item.label;
    for (const child of item.children ?? []) out[child.id] = child.label;
  }
  return out;
}
