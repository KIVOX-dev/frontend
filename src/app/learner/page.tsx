"use client";

import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerShell } from "@/components/layout/LearnerShell";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FEATURE_FLAGS } from "@/config/featureFlags";

// Only one of these renders at a time (renderScreen switch below) —
// dynamic-importing keeps every other screen's code out of this route's
// bundle and out of the dev-server's first-compile graph.
const LearnerLogin = dynamic(() => import("@/components/learner/LearnerLogin").then((m) => m.LearnerLogin));
const LearnerDashboard = dynamic(() => import("@/components/learner/LearnerDashboard").then((m) => m.LearnerDashboard));
const LearnerMockInterview = dynamic(() => import("@/components/learner/LearnerMockInterview").then((m) => m.LearnerMockInterview));
const ResumeBuilder = dynamic(() => import("@/components/learner/ResumeBuilder").then((m) => m.ResumeBuilder));
const AptitudeTests = dynamic(() => import("@/components/learner/AptitudeTests").then((m) => m.AptitudeTests));
const PracticeModule = dynamic(() => import("@/components/learner/PracticeModule").then((m) => m.PracticeModule));
const MNCTestModule = dynamic(() => import("@/components/learner/MNCTestModule").then((m) => m.MNCTestModule));
const Leaderboard = dynamic(() => import("@/components/learner/Leaderboard").then((m) => m.Leaderboard));
const Subscription = dynamic(() => import("@/components/learner/Subscription").then((m) => m.Subscription));
const TestHistory = dynamic(() => import("@/components/learner/TestHistory").then((m) => m.TestHistory));
const PlacementOpportunities = dynamic(() => import("@/components/learner/PlacementOpportunities").then((m) => m.PlacementOpportunities));
const PlatformChat = dynamic(() => import("@/components/shared/PlatformChat").then((m) => m.PlatformChat));
const SettingsPanel = dynamic(() => import("@/components/shared/SettingsPanel").then((m) => m.SettingsPanel));
const ProfilePanel = dynamic(() => import("@/components/shared/ProfilePanel").then((m) => m.ProfilePanel));
const MyActivity = dynamic(() => import("@/components/shared/MyActivity").then((m) => m.MyActivity));
const MyLearnings = dynamic(() => import("@/components/learner/MyLearnings").then((m) => m.MyLearnings));
const YoutubeCourseImport = dynamic(() => import("@/components/learner/YoutubeCourseImport").then((m) => m.YoutubeCourseImport));
const AssessmentWindow = dynamic(() => import("@/components/learner/AssessmentWindow").then((m) => m.AssessmentWindow));

// Separate component so useSearchParams is inside a Suspense boundary
function LearnerContent() {
  const { isAuthenticated, user } = useAuthStore();
  const { activeScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const screenParam = searchParams.get("screen");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lands here after an OAuth callback redirect (GitHub/LinkedIn/Stack
  // Overflow — see node-api's githubAuth/linkedinAuth/stackexchangeAuth
  // service.js) — that round trip has no in-memory uiStore state to return
  // to, only this URL, so `?screen=profile-info` is how it tells this page
  // which screen to open. ProfilePanel.tsx itself reads the remaining
  // `tab`/`<provider>`/`reason` params and strips the query string afterward.
  useEffect(() => {
    if (screenParam) {
      useUiStore.getState().setActiveScreen(screenParam);
    }
  }, [screenParam]);

  if (!mounted) return null;

  // Auth is one shared store across every portal, so a session authenticated
  // elsewhere (e.g. super-admin) must not fall through to this dashboard.
  if (!isAuthenticated || user?.role !== "student") {
    return <LearnerLogin initialMode={mode} />;
  }

  // Opened via window.open() as its own browser window/tab (see
  // CourseViewer.tsx's Assessment tab) — deliberately unwrapped by
  // LearnerShell below (no sidebar) so there's nowhere to navigate away to
  // without it counting as leaving the window entirely. Read directly off
  // the URL param rather than waiting on the effect-driven activeScreen
  // update above, so this renders on the very first paint instead of
  // flashing the Dashboard first.
  if ((screenParam || activeScreen) === "lesson-assessment") {
    return <AssessmentWindow />;
  }

  const renderScreen = () => {
    // Hidden behind FEATURE_FLAGS.youtubeToCourse for the current user test
    // group — redirected to the same "coming soon" default the switch below
    // already falls back to for any unrecognized screen id, so a stale
    // ?screen= link can't reach it either. Code/routes are untouched; this
    // is the only gate, flip the flag back on to restore both the nav item
    // (LearnerShell.tsx) and this.
    const screen =
      !FEATURE_FLAGS.youtubeToCourse && (activeScreen === "learnings" || activeScreen === "youtube-course-import")
        ? "youtube-course-hidden"
        : activeScreen;
    switch (screen) {
      case "dash": return <LearnerDashboard />;
      case "practice": return <PracticeModule />;
      case "tests": return <AptitudeTests />;
      case "mnc": return <MNCTestModule />;
      case "iv": return <LearnerMockInterview />;
      case "resume": return <ResumeBuilder />;
      case "lb": return <Leaderboard />;
      case "placements":
        if (user?.college_id) return <PlacementOpportunities />;
        return (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            <h2>Placements</h2>
            <p>Placements is available for institutional students only.</p>
          </div>
        );
      case "history": return <TestHistory />;
      case "subs": return <Subscription />;
      case "chat": return <PlatformChat />;
      // "profile" (old id) -> Profile page — graceful redirect for anyone
      // whose persisted activeScreen still points at the now-removed
      // standalone "Profile Summarizer" screen.
      case "profile":
      case "profile-info": return <ProfilePanel />;
      case "settings": return <SettingsPanel />;
      case "my-activity": return <MyActivity />;
      case "learnings": return <MyLearnings />;
      case "youtube-course-import": return <YoutubeCourseImport />;
      default:
        return (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            <h2>{activeScreen.toUpperCase()} Screen</h2>
            <p>This module is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <LearnerShell>
      {renderScreen()}
    </LearnerShell>
  );
}

export default function LearnerPage() {
  return (
    <Suspense fallback={null}>
      <LearnerContent />
    </Suspense>
  );
}

