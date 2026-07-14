"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function HrShell({ children }: { children: React.ReactNode }) {
  const {
    activeScreen,
    setActiveScreen,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    toggleMobileSidebar,
    uiMode,
    setUiMode,
  } = useUiStore();

  const { user, logout, updateUser } = useAuthStore();

  React.useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      api.get("/auth/me").then(res => {
        updateUser(res.data);
      }).catch(() => {});
    });
  }, [updateUser]);

  const navItems = [
    { id: "hr-dash", label: "Dashboard", section: "Talent Sourcing", icon: <DashboardIcon /> },
    { id: "hr-vac", label: "Post Vacancy", icon: <VacancyIcon /> },
    { id: "hr-app", label: "Applicants", icon: <ApplicantsIcon /> },
    { id: "hr-lb", label: "Talent Board", icon: <BoardIcon /> },
    { id: "hr-analytics", label: "Candidate Analytics", section: "Insights", icon: <AnalyticsIcon /> },
  ];

  const currentScreen = activeScreen === "dash" ? "hr-dash" : activeScreen;

  return (
    <div id="app" className={isMobileSidebarOpen ? "mob-sidebar-open" : ""}>
      {/* Sidebar */}
      <div id="sidebar" className={isSidebarCollapsed ? "collapsed" : ""} style={{ borderRightColor: "rgba(108,92,231,.15)" }}>
        <div className="s-logo" style={{ 
          background: "linear-gradient(135deg,rgba(108,92,231,.08),transparent)", 
          borderBottomColor: "rgba(108,92,231,.15)", 
          flexDirection: isSidebarCollapsed ? "row" : "column", 
          alignItems: isSidebarCollapsed ? "center" : "flex-start", 
          justifyContent: isSidebarCollapsed ? "center" : "flex-start",
          height: "auto", 
          padding: isSidebarCollapsed ? "20px 0" : "20px" 
        }}>
          {isSidebarCollapsed ? (
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)", letterSpacing: "-1px" }}>BU</div>
          ) : (
            <>
              <img src="/buddies-logo.jpg" alt="BUDDIES" className="brand-logo" style={{ marginBottom: "8px", height: "36px", width: "auto", borderRadius: "6px", objectFit: "contain" }} />
              <div className="logo-text" style={{ fontSize: "11px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Recruiter Portal</div>
            </>
          )}
        </div>

        <div id="hrnav" style={{ padding: isSidebarCollapsed ? "10px 0" : "10px" }}>
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.section && <div className="nav-sec">{item.section}</div>}
              <div
                className={`nav-item ${currentScreen === item.id ? "active" : ""}`}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <input type="text" placeholder="Search applicants, roles, skills..." />
          </div>
          <div className="tbr">
            <div className="ib">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div className="nd"></div>
            </div>
            <div className="uc">
              <div className="uav" style={{ background: "linear-gradient(135deg,var(--purple),var(--pink))" }}>HR</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="un">{user?.name || "HR Manager"}</span>
                <span className="ur">{(user as any)?.company_name || (user as any)?.company }</span>
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

function VacancyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function ApplicantsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
