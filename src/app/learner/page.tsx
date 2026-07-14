"use client";

import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerLogin } from "@/components/learner/LearnerLogin";
import { LearnerShell } from "@/components/layout/LearnerShell";
import { LearnerDashboard } from "@/components/learner/LearnerDashboard";
import { LearnerMockInterview } from "@/components/learner/LearnerMockInterview";
import { ResumeBuilder } from "@/components/learner/ResumeBuilder";
import { AptitudeTests } from "@/components/learner/AptitudeTests";
import { PracticeModule } from "@/components/learner/PracticeModule";
import { MNCTestModule } from "@/components/learner/MNCTestModule";
import { Leaderboard } from "@/components/learner/Leaderboard";
import { Subscription } from "@/components/learner/Subscription";
import { ProfileSummarizer } from "@/components/learner/ProfileSummarizer";
import { TestHistory } from "@/components/learner/TestHistory";
import { PlatformChat } from "@/components/shared/PlatformChat";
import { SettingsPanel } from "@/components/shared/SettingsPanel";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Separate component so useSearchParams is inside a Suspense boundary
function LearnerContent() {
  const { isAuthenticated } = useAuthStore();
  const { activeScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAuthenticated) {
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
      case "history": return <TestHistory />;
      case "subs": return <Subscription />;
      case "chat": return <PlatformChat />;
      case "settings": return <SettingsPanel />;
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

