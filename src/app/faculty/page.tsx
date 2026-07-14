"use client";

import React, { useEffect, useState } from "react";
import { FacultyLogin } from "@/components/auth/FacultyLogin";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerShell } from "@/components/layout/LearnerShell";
import { FacultyUpload } from "@/components/faculty/FacultyUpload";
import { FacultyDashboard } from "@/components/institutional/FacultyDashboard";
import { AddStudentPanel } from "@/components/institutional/AddStudentPanel";
import { StudentTracking } from "@/components/institutional/StudentTracking";
import { PlatformChat } from "@/components/shared/PlatformChat";
import { SettingsPanel } from "@/components/shared/SettingsPanel";

export default function FacultyPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { activeScreen, setActiveScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (activeScreen === "dash" || !activeScreen) {
      setActiveScreen("dash");
    }
  }, []);

  if (!mounted) return null;

  if (!isAuthenticated || user?.role !== "faculty") {
    return <FacultyLogin />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case "dash": return <FacultyDashboard />;
      case "tracking": return <StudentTracking />;
      case "add-student": return <AddStudentPanel />;
      case "upload": return <FacultyUpload />;
      case "chat": return <PlatformChat />;
      case "settings": return <SettingsPanel />;
      default: return <FacultyDashboard />;
    }
  };

  return (
    <LearnerShell>
      {renderScreen()}
    </LearnerShell>
  );
}
