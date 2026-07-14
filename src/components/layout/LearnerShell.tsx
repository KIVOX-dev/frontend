"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

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
  
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      api.get("/auth/me").catch(() => {});
      if (user?.role === "college_admin" || user?.role === "super_admin") {
        api.get("/users/pending").then((res) => {
          setPendingCount(res.data.length);
        }).catch(() => {});
      }
    });
  }, [user?.role]);

  const isInstitutionalStudent = user?.role === "student" && !!user?.college_id;

  const navItems = user?.role === "college_admin" 
    ? [
        { id: "dash", label: "Dashboard", section: "Master Console", icon: <DashboardIcon /> },
        { id: "security", label: "Security & Approvals", icon: <PracticeIcon /> },
        { id: "assessments", label: "Assessments", icon: <TestsIcon /> },
        { id: "tracking", label: "Student Tracking", icon: <ProfileIcon /> },
        { id: "chat", label: "Messages", icon: <ChatIcon /> },
        { id: "settings", label: "Settings", icon: <SettingsIcon /> },
      ]
    : user?.role === "faculty"
    ? [
        { id: "dash", label: "Dashboard", section: "Faculty Portal", icon: <DashboardIcon /> },
        { id: "tracking", label: "Student Tracking", icon: <ProfileIcon /> },
        { id: "add-student", label: "Add Student", icon: <PracticeIcon /> },
        { id: "upload", label: "Upload Students", icon: <ResumeIcon /> },
        { id: "chat", label: "Messages", icon: <ChatIcon /> },
        { id: "settings", label: "Settings", icon: <SettingsIcon /> },
      ]
    : [
        { id: "dash", label: "Dashboard", section: "Learning Portal", icon: <DashboardIcon /> },
        { id: "history", label: "Test History", icon: <ResumeIcon /> },
        { id: "practice", label: "Mock Practice", icon: <PracticeIcon /> },
        { id: "tests", label: "Aptitude Tests", icon: <TestsIcon /> },
        { id: "mnc", label: "MNC Test", icon: <MncIcon /> },
        { id: "iv", label: "Mock Interviewer", icon: <IvIcon /> },
        ...(isInstitutionalStudent ? [
          { id: "profile", label: "Profile Summarizer", section: "Professional Profile", icon: <ProfileIcon /> },
          { id: "resume", label: "Resume Builder", icon: <ResumeIcon /> },
          { id: "lb", label: "Top Talent Board", icon: <LeaderboardIcon /> },
        ] : []),
        { id: "chat", label: "Messages", icon: <ChatIcon />, section: isInstitutionalStudent ? undefined : "Professional Profile" },
        { id: "settings", label: "Settings", icon: <SettingsIcon /> },
      ];

  return (
    <div id="app" className={isMobileSidebarOpen ? "mob-sidebar-open" : ""}>
      {/* Sidebar */}
      <div id="sidebar" className={isSidebarCollapsed ? "collapsed" : ""}>
        <div className="s-logo" style={{ justifyContent: isSidebarCollapsed ? "center" : "flex-start", padding: isSidebarCollapsed ? "16px 0" : "16px 14px 15px" }}>
          {isSidebarCollapsed ? (
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent)", letterSpacing: "-1px" }}>BU</div>
          ) : (
            <img src="/buddies-logo.jpg" alt="BUDDIES" className="brand-logo" style={{ height: "36px", width: "auto", borderRadius: "6px", objectFit: "contain" }} />
          )}
        </div>

        <div id="snav">
          {navItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.section && <div className="nav-sec">{item.section}</div>}
              <div
                className={`nav-item ${activeNav === `nav-${item.id}` ? "active" : ""}`}
                id={`nav-${item.id}`}
                onClick={() => setActiveScreen(item.id)}
              >
                {item.icon}
                <span className="nav-lbl">{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="s-foot">
          {user?.role === "student" && !user?.college_id && (
            <div className="plan-strip" onClick={() => setActiveScreen("subs")}>
              <div className="plan-name">Free Plan</div>
              <div className="plan-sub">Upgrade for more features</div>
              <div className="plan-bar-w">
                <div className="plan-bar-f" style={{ width: "20%", background: "var(--accent)" }}></div>
              </div>
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
          <div id="mob-menu-btn" onClick={() => toggleMobileSidebar()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </div>
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
              {pendingCount > 0 && (
                <div style={{ position: "absolute", top: "-2px", right: "-2px", background: "red", color: "white", fontSize: "10px", fontWeight: "bold", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {pendingCount}
                </div>
              )}
            </div>
            <div className="uc">
              <div className="uav">{user?.name?.charAt(0) || "S"}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="un">{user?.name || "Student"}</span>
                <span className="ur">
                  {user?.role === "college_admin" ? "Institution Admin" : 
                   user?.role === "faculty" ? "Faculty Portal" : 
                   user?.role === "super_admin" ? "Master Console" : "Learner Portal"}
                </span>
              </div>
            </div>
            <div className="ib" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
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
