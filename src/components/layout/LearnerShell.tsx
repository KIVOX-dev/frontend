"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const {
    activeNav,
    setActiveScreen,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    toggleMobileSidebar,
    uiMode,
    setUiMode,
  } = useUiStore();

  const { user, logout } = useAuthStore();

  React.useEffect(() => {
    // Session check on mount; its result is intentionally unused — a 401 here
    // is handled by the shared axios interceptor, not by this component.
    import("@/lib/api").then(({ api }) => {
      api.get("/auth/me").catch(() => {});
    });
  }, []);

  const isInstitutionalStudent = user?.role === "student" && !!user?.college_id;

  // "Practice Tools" mirrors the collapsible-group pattern of a reference
  // sidebar (GoodFreshers' "Tools") — the three lower-frequency practice
  // modes nest under one expandable entry instead of sitting flat alongside
  // daily-use screens (Dashboard/Test History/Aptitude Tests).
  const PRACTICE_TOOLS_GROUP_ID = "practice-tools";
  const practiceToolsChildren = [
    { id: "practice", label: "Mock Practice", icon: <PracticeIcon /> },
    { id: "mnc", label: "MNC Test", icon: <MncIcon /> },
    { id: "iv", label: "Mock Interviewer", icon: <IvIcon /> },
  ];

  const navItems = user?.role === "faculty"
    ? [
        { id: "dash", label: "Dashboard", section: "Faculty Portal", icon: <DashboardIcon /> },
        { id: "profile-info", label: "Profile", icon: <ProfileIcon /> },
        { id: "tracking", label: "Student Tracking", icon: <ProfileIcon /> },
        { id: "add-student", label: "Add Student", icon: <PracticeIcon /> },
        { id: "upload", label: "Upload Students", icon: <ResumeIcon /> },
        // Settings lives in the profile chip's dropdown (ProfileMenu.tsx),
        // not the sidebar — one entry point instead of two for the same screen.
        { id: "chat", label: "Messages", icon: <ChatIcon /> },
      ]
    : [
        { id: "dash", label: "Dashboard", section: "Learning Portal", icon: <DashboardIcon /> },
        { id: "profile-info", label: "Profile", icon: <ProfileIcon /> },
        // Test History lives behind the "History" button inside Aptitude
        // Tests (AptitudeTests.tsx) now, not the sidebar — one entry point
        // instead of two for the same screen.
        { id: "tests", label: "Aptitude Tests", icon: <TestsIcon /> },
        // Hidden behind FEATURE_FLAGS.youtubeToCourse for the current user
        // test group — code/routes untouched, just not reachable from here
        // until that flag flips back on. See app/learner/page.tsx and
        // app/institutional/page.tsx's renderScreen for the matching guard.
        ...(FEATURE_FLAGS.youtubeToCourse ? [{ id: "learnings", label: "Learnings", icon: <LearningsIcon /> }] : []),
        { id: PRACTICE_TOOLS_GROUP_ID, label: "Practice Tools", icon: <PracticeIcon />, children: practiceToolsChildren },
        ...(FEATURE_FLAGS.youtubeToCourse
          ? [{ id: "youtube-course-import", label: "YouTube to Course", icon: <YoutubeToolIcon /> }]
          : []),
        ...(isInstitutionalStudent ? [
          { id: "placements", label: "Placements", section: "Professional Profile", icon: <PlacementIcon /> },
          // Performance Summary (formerly its own "Profile Summarizer" nav
          // item) now lives inside the Profile screen's About tab — see
          // ProfilePanel.tsx's PerformanceSummarySection.
          { id: "resume", label: "Resume Builder", icon: <ResumeIcon /> },
          { id: "lb", label: "Top Talent Board", icon: <LeaderboardIcon /> },
        ] : []),
        // "Messages" (chat) is a faculty-only entry point (see the faculty
        // branch above) — students don't get it in the sidebar.
      ];

  // Auto-expand the group whenever navigation lands on one of its children
  // (e.g. a deep link, or switching accounts) — otherwise the active screen
  // could be selected while its own group still renders collapsed.
  const activeChildGroupId = navItems.find(
    (item) => "children" in item && item.children?.some((c) => `nav-${c.id}` === activeNav)
  )?.id;
  // { groupId, expanded } rather than a bare `string | null` — the previous
  // version stored only "which group is manually expanded", so collapsing
  // (clearing it back to null) had no effect whenever the active screen was
  // still one of that group's children: the display fell back to
  // `manuallyExpandedGroup ?? activeChildGroupId`, and activeChildGroupId
  // alone re-expanded it every time, making the group permanently stuck open.
  // Storing the explicit boolean choice means a deliberate "collapsed" survives
  // that fallback instead of being swallowed by it.
  const [expandedOverride, setExpandedOverride] = React.useState<{ groupId: string; expanded: boolean } | null>(null);

  return (
    <div id="app" className={isMobileSidebarOpen ? "mob-sidebar-open" : ""}>
      {/* Sidebar */}
      <div id="sidebar" className={isSidebarCollapsed ? "collapsed" : ""}>
        <div className="s-logo" style={{ justifyContent: isSidebarCollapsed ? "center" : "flex-start", padding: isSidebarCollapsed ? "16px 0" : "16px 14px 15px" }}>
          {isSidebarCollapsed ? (
            <Logo variant="mark" height={28} />
          ) : (
            <Logo variant="brand" height={36} className="brand-logo" />
          )}
        </div>

        <div id="snav">
          {navItems.map((item) => {
            const hasChildren = "children" in item && Array.isArray(item.children);
            const isExpanded =
              hasChildren &&
              (expandedOverride && expandedOverride.groupId === item.id
                ? expandedOverride.expanded
                : activeChildGroupId === item.id);
            return (
              <React.Fragment key={item.id}>
                {item.section && <div className="nav-sec">{item.section}</div>}
                <button
                  type="button"
                  className={`nav-item ${!hasChildren && activeNav === `nav-${item.id}` ? "active" : ""}`}
                  id={`nav-${item.id}`}
                  onClick={() =>
                    hasChildren
                      ? setExpandedOverride({ groupId: item.id, expanded: !isExpanded })
                      : setActiveScreen(item.id)
                  }
                  aria-current={!hasChildren && activeNav === `nav-${item.id}` ? "page" : undefined}
                  aria-expanded={hasChildren ? isExpanded : undefined}
                >
                  {item.icon}
                  <span className="nav-lbl" style={{ flex: 1 }}>{item.label}</span>
                  {hasChildren && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="14"
                      height="14"
                      style={{ transform: isExpanded ? "rotate(180deg)" : undefined, transition: "transform 0.15s", flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>
                {hasChildren && isExpanded && "children" in item && item.children?.map((child) => (
                  <button
                    type="button"
                    key={child.id}
                    className={`nav-item ${activeNav === `nav-${child.id}` ? "active" : ""}`}
                    id={`nav-${child.id}`}
                    onClick={() => setActiveScreen(child.id)}
                    aria-current={activeNav === `nav-${child.id}` ? "page" : undefined}
                    style={{ paddingLeft: "38px" }}
                  >
                    {child.icon}
                    <span className="nav-lbl">{child.label}</span>
                  </button>
                ))}
              </React.Fragment>
            );
          })}
        </div>

        <div className="s-foot">
          {user?.role === "student" && !user?.college_id && (
            <button
              type="button"
              className="plan-strip"
              onClick={() => setActiveScreen("subs")}
              style={{ display: "block", width: "100%", textAlign: "left" }}
            >
              <div className="plan-name">Free Plan</div>
              <div className="plan-sub">Upgrade for more features</div>
              <div className="plan-bar-w">
                <div className="plan-bar-f" style={{ width: "20%", background: "var(--accent)" }}></div>
              </div>
            </button>
          )}
          {!isSidebarCollapsed && (
            // Opens in a new tab rather than navigating this tab away from
            // an in-progress test/practice session — these are separate
            // marketing-site pages (src/app/privacy-policy, .../terms-of-service),
            // not part of this SPA's screen-switcher.
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "4px 0 8px", fontSize: "11px", color: "var(--muted)" }}>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Privacy Policy</Link>
              <span>|</span>
              <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Terms &amp; Conditions</Link>
            </div>
          )}
          <button className="collapse-btn" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points={isSidebarCollapsed ? "13 17 18 12 13 7" : "11 17 6 12 11 7"} />
              <polyline points={isSidebarCollapsed ? "6 17 11 12 6 7" : "18 17 13 12 18 7"} />
            </svg>
            <span>{isSidebarCollapsed ? "" : "Collapse"}</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div id="main">
        <div id="topbar">
          <button type="button" id="mob-menu-btn" onClick={() => toggleMobileSidebar()} aria-label="Toggle menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="sw">
            <span className="si">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input type="text" placeholder="Search lessons, tests, or MNCs..." />
          </div>
          <div className="tbr">
            <div className="ib" style={{ position: "relative" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <ProfileMenu
              avatar={user?.name?.charAt(0) || "S"}
              name={user?.name || "Student"}
              roleLabel={user?.role === "faculty" ? "Faculty Portal" : "Learner Portal"}
            />
            <button type="button" className="ib" onClick={logout} aria-label="Log out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div id="content">{children}</div>
      </div>
    </div>
  );
}

// Icons (SVG paths from learner.html)
function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LearningsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function YoutubeToolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s0-3.5.5-5A2.5 2.5 0 014.6 5.5C6.2 5 12 5 12 5s5.8 0 7.4.5A2.5 2.5 0 0121.5 7c.5 1.5.5 5 .5 5s0 3.5-.5 5a2.5 2.5 0 01-1.9 1.9c-1.6.5-7.4.5-7.4.5s-5.8 0-7.4-.5A2.5 2.5 0 012.5 17c-.5-1.5-.5-5-.5-5z" />
      <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function MncIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function IvIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function PlacementIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function LeaderboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8" />
      <path d="M12 17V7" />
      <path d="M7 4h10" />
      <path d="M17 11l-5 5-5-5" />
    </svg>
  );
}


function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M13 8H7" />
      <path d="M17 12H7" />
    </svg>
  );
}
