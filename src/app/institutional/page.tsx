"use client";

import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerShell } from "@/components/layout/LearnerShell";
import { CollegeAdminShell } from "@/components/layout/CollegeAdminShell";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { useEffect, useState } from "react";

// Only one of these renders at a time (role selection / renderScreen switch
// below) — dynamic-importing them keeps every other role's/screen's code
// out of this route's bundle and out of the dev-server's first-compile graph.
const CollegeAdminLogin = dynamic(() => import("@/components/auth/CollegeAdminLogin").then((m) => m.CollegeAdminLogin));
const FacultyLogin = dynamic(() => import("@/components/auth/FacultyLogin").then((m) => m.FacultyLogin));
const InstitutionalStudentLogin = dynamic(() => import("@/components/auth/InstitutionalStudentLogin").then((m) => m.InstitutionalStudentLogin));
const PlatformChat = dynamic(() => import("@/components/shared/PlatformChat").then((m) => m.PlatformChat));
const SettingsPanel = dynamic(() => import("@/components/shared/SettingsPanel").then((m) => m.SettingsPanel));
const CollegeAdminDashboard = dynamic(() => import("@/components/institutional/CollegeAdminDashboard").then((m) => m.CollegeAdminDashboard));
const FacultyDashboard = dynamic(() => import("@/components/institutional/FacultyDashboard").then((m) => m.FacultyDashboard));
const InstitutionalApproval = dynamic(() => import("@/components/institutional/InstitutionalApproval").then((m) => m.InstitutionalApproval));
const StudentTracking = dynamic(() => import("@/components/institutional/StudentTracking").then((m) => m.StudentTracking));
const AddStudentPanel = dynamic(() => import("@/components/institutional/AddStudentPanel").then((m) => m.AddStudentPanel));
const FacultyUpload = dynamic(() => import("@/components/faculty/FacultyUpload").then((m) => m.FacultyUpload));
const AptitudeTests = dynamic(() => import("@/components/learner/AptitudeTests").then((m) => m.AptitudeTests));
const PracticeModule = dynamic(() => import("@/components/learner/PracticeModule").then((m) => m.PracticeModule));
const MNCTestModule = dynamic(() => import("@/components/learner/MNCTestModule").then((m) => m.MNCTestModule));
const LearnerMockInterview = dynamic(() => import("@/components/learner/LearnerMockInterview").then((m) => m.LearnerMockInterview));
const ProfileSummarizer = dynamic(() => import("@/components/learner/ProfileSummarizer").then((m) => m.ProfileSummarizer));
const ResumeBuilder = dynamic(() => import("@/components/learner/ResumeBuilder").then((m) => m.ResumeBuilder));
const Leaderboard = dynamic(() => import("@/components/learner/Leaderboard").then((m) => m.Leaderboard));
const LearnerDashboard = dynamic(() => import("@/components/learner/LearnerDashboard").then((m) => m.LearnerDashboard));
const TestHistory = dynamic(() => import("@/components/learner/TestHistory").then((m) => m.TestHistory));
const PlacementOpportunities = dynamic(() => import("@/components/learner/PlacementOpportunities").then((m) => m.PlacementOpportunities));

type InstitutionalRole = "none" | "admin" | "faculty" | "student";

// Auth is one shared store across every portal, so "isAuthenticated" alone
// doesn't mean "authenticated *here*" — a super-admin or HR session is still
// isAuthenticated, but has no business rendering this portal's dashboard.
const INSTITUTIONAL_ROLES = ["college_admin", "institution_admin", "faculty", "student"];

// Mirrors each shell's own nav item ids (CollegeAdminShell.tsx / LearnerShell.tsx)
// so activeScreen can be validated against whatever the CURRENT user's role is
// actually allowed to see. Needed because useUiStore's activeScreen lives
// outside authStore and isn't reset on login/logout — switching accounts in
// the same tab (e.g. an institution admin on "users" logs out, a student logs
// in) otherwise leaves activeScreen pointed at the previous account's screen,
// and renderScreen()'s switch below has no per-case role check of its own, so
// it renders an admin-only component (CollegeAdminDashboard) for a student —
// which then 403s fetching /users instead of showing anything sensible.
const ADMIN_SCREENS = new Set(["dash", "placements", "drives", "users", "security", "assessments", "tracking", "chat", "settings"]);
const FACULTY_SCREENS = new Set(["dash", "tracking", "add-student", "upload", "chat", "settings"]);
const BASE_STUDENT_SCREENS = ["dash", "history", "practice", "tests", "mnc", "iv", "chat", "settings"];
const INSTITUTIONAL_STUDENT_EXTRA_SCREENS = ["placements", "profile", "resume", "lb"];

export default function InstitutionalPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { activeScreen, setActiveScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InstitutionalRole>("none");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard against a stale activeScreen left over from a different account's
  // session (see ADMIN_SCREENS/FACULTY_SCREENS/BASE_STUDENT_SCREENS comment
  // above) — bounce back to "dash" the moment the current role can't see
  // whatever screen is currently selected, before renderScreen() ever runs.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let allowed: Set<string> | null = null;
    if (user.role === "college_admin" || user.role === "institution_admin") {
      allowed = ADMIN_SCREENS;
    } else if (user.role === "faculty") {
      allowed = FACULTY_SCREENS;
    } else if (user.role === "student") {
      allowed = new Set(BASE_STUDENT_SCREENS);
      if (user.college_id) INSTITUTIONAL_STUDENT_EXTRA_SCREENS.forEach((s) => allowed!.add(s));
    }
    if (allowed && !allowed.has(activeScreen)) {
      setActiveScreen("dash");
    }
  }, [isAuthenticated, user, activeScreen, setActiveScreen]);

  if (!mounted) return null;

  // If they're not authenticated for THIS portal, show the Hub or the selected login
  if (!isAuthenticated || !INSTITUTIONAL_ROLES.includes(user?.role ?? "")) {
    if (selectedRole === "admin") return <CollegeAdminLogin onBack={() => setSelectedRole("none")} />;
    if (selectedRole === "faculty") return <FacultyLogin onBack={() => setSelectedRole("none")} />;
    if (selectedRole === "student") return <InstitutionalStudentLogin onBack={() => setSelectedRole("none")} />;
    
    // The Hub
    return (
      <AuthSplitLayout>
        <div className="lp-card">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div className="flex justify-center mb-6">
              <Logo variant="brand" height={48} priority />
            </div>
            <h2 style={{ fontSize: "28px", color: "var(--text)", fontWeight: 800, marginBottom: "12px" }}>
              Institutional Portal
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "15px" }}>
              Select your role to access your dashboard
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button 
              onClick={() => setSelectedRole("admin")}
              style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ background: "var(--accent-l)", color: "var(--accent)", padding: "12px", borderRadius: "12px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "4px" }}>Institution Admin</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>Manage placements, faculty, and reports</div>
              </div>
            </button>

            <button 
              onClick={() => setSelectedRole("faculty")}
              style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--purple)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ background: "var(--purple-l)", color: "var(--purple)", padding: "12px", borderRadius: "12px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "4px" }}>Faculty</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>Monitor student progress and assign tests</div>
              </div>
            </button>

            <button 
              onClick={() => setSelectedRole("student")}
              style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--teal)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ background: "var(--teal-l)", color: "var(--teal)", padding: "12px", borderRadius: "12px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "4px" }}>Institutional Student</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>Access your college-assigned learning path</div>
              </div>
            </button>
          </div>
        </div>
      </AuthSplitLayout>
    );
  }

  // Render the active screen based on sidebar selection
  const renderScreen = () => {
    switch (activeScreen) {
      case "dash":
        if (user?.role === "college_admin" || user?.role === "institution_admin") return <CollegeAdminDashboard />;
        if (user?.role === "faculty") return <FacultyDashboard />;
        if (user?.role === "student") return <LearnerDashboard />;
        return (
          <div style={{ padding: "40px" }}>
            <h2>Welcome, {user?.name}</h2>
            <p>Role: {user?.role}</p>
          </div>
        );
      case "security":
        return <InstitutionalApproval />;
      case "assessments":
        return <CollegeAdminDashboard />;
      case "placements":
        if (user?.role === "student" && user?.college_id) return <PlacementOpportunities />;
        return <CollegeAdminDashboard />;
      case "drives":
        return <CollegeAdminDashboard />;
      case "users":
        return <CollegeAdminDashboard />;
      case "tracking":
        return <StudentTracking />;
      case "history":
        return <TestHistory />;
      case "tests":
        return <AptitudeTests />;
      case "practice":
        return <PracticeModule />;
      case "mnc":
        return <MNCTestModule />;
      case "iv":
        return <LearnerMockInterview />;
      case "profile":
        return <ProfileSummarizer />;
      case "resume":
        return <ResumeBuilder />;
      case "lb":
        return <Leaderboard />;
      case "add-student":
        return <AddStudentPanel />;
      case "upload":
        return <FacultyUpload />;
      case "chat":
        return <PlatformChat />;
      case "settings":
        return <SettingsPanel />;
      default:
        return (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            <h2>{activeScreen.toUpperCase()} Screen</h2>
            <p>This module is coming soon.</p>
          </div>
        );
    }
  };

  if (user?.role === "college_admin" || user?.role === "institution_admin") {
    return <CollegeAdminShell>{renderScreen()}</CollegeAdminShell>;
  }

  return (
    <LearnerShell>
      {renderScreen()}
    </LearnerShell>
  );
}

