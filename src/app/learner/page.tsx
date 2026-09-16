"use client";

import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerShell } from "@/components/layout/LearnerShell";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
const ProfileSummarizer = dynamic(() => import("@/components/learner/ProfileSummarizer").then((m) => m.ProfileSummarizer));
const TestHistory = dynamic(() => import("@/components/learner/TestHistory").then((m) => m.TestHistory));
const PlacementOpportunities = dynamic(() => import("@/components/learner/PlacementOpportunities").then((m) => m.PlacementOpportunities));
const PlatformChat = dynamic(() => import("@/components/shared/PlatformChat").then((m) => m.PlatformChat));
const SettingsPanel = dynamic(() => import("@/components/shared/SettingsPanel").then((m) => m.SettingsPanel));
const MyActivity = dynamic(() => import("@/components/shared/MyActivity").then((m) => m.MyActivity));

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

  // Lands here after the GitHub OAuth callback redirect (see node-api's
  // githubAuth.service.js) — that round trip has no in-memory uiStore state
  // to return to, only this URL, so `?screen=settings` is how it tells this
  // page which screen to open. SettingsPanel.tsx itself reads the remaining
  // `tab`/`github`/`reason` params and strips the query string afterward.
  useEffect(() => {
    if (screenParam === "settings") {
      useUiStore.getState().setActiveScreen("settings");
    }
  }, [screenParam]);

  if (!mounted) return null;

  // Auth is one shared store across every portal, so a session authenticated
  // elsewhere (e.g. super-admin) must not fall through to this dashboard.
  if (!isAuthenticated || user?.role !== "student") {
    return <LearnerLogin initialMode={mode} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case "dash": return <LearnerDashboard />;
      case "practice": return <PracticeModule />;
      case "tests": return <AptitudeTests />;
      case "mnc": return <MNCTestModule />;
      case "iv": return <LearnerMockInterview />;
      case "profile": return <ProfileSummarizer />;
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
      case "settings": return <SettingsPanel />;
      case "my-activity": return <MyActivity />;
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

