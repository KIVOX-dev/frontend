"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function CollegeAdminShell({ children }: { children: React.ReactNode }) {
  const {
    activeNav,
    setActiveScreen,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    toggleMobileSidebar,
  } = useUiStore();

  const { user, logout } = useAuthStore();

  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    import("@/lib/api").then(({ api }) => {
      api.get("/users/pending").then((res) => {
        if (!cancelled) setPendingCount(res.data.length);
      }).catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = [
    { id: "dash", label: "Dashboard", section: "Master Console", icon: <DashboardIcon /> },
    { id: "placements", label: "Recent Placements", icon: <ResumeIcon /> },
    { id: "drives", label: "Placement Drives", icon: <MncIcon /> },
    { id: "users", label: "Manage Users", icon: <ProfileIcon /> },
    { id: "security", label: "Security & Approvals", icon: <PracticeIcon /> },
    { id: "assessments", label: "Assessments", icon: <TestsIcon /> },
    { id: "tracking", label: "Student Tracking", icon: <IvIcon /> },
    { id: "chat", label: "Messages", icon: <ChatIcon /> },
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
          {navItems.map((item) => (
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
            <input type="text" placeholder="Search users, placements, or drives..." />
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
              <div className="uav">{user?.name?.charAt(0) || "A"}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="un">{user?.name || "Institution Admin"}</span>
                <span className="ur">Institution Admin</span>
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

// Icons
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
