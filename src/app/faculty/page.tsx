"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { LearnerShell } from "@/components/layout/LearnerShell";

// Only one of these renders at a time (renderScreen switch below) —
// dynamic-importing keeps every other screen's code out of this route's
// bundle and out of the dev-server's first-compile graph.
const FacultyLogin = dynamic(() => import("@/components/auth/FacultyLogin").then((m) => m.FacultyLogin));
const FacultyUpload = dynamic(() => import("@/components/faculty/FacultyUpload").then((m) => m.FacultyUpload));
const FacultyDashboard = dynamic(() => import("@/components/institutional/FacultyDashboard").then((m) => m.FacultyDashboard));
const AddStudentPanel = dynamic(() => import("@/components/institutional/AddStudentPanel").then((m) => m.AddStudentPanel));
const StudentTracking = dynamic(() => import("@/components/institutional/StudentTracking").then((m) => m.StudentTracking));
const PlatformChat = dynamic(() => import("@/components/shared/PlatformChat").then((m) => m.PlatformChat));
const SettingsPanel = dynamic(() => import("@/components/shared/SettingsPanel").then((m) => m.SettingsPanel));

export default function FacultyPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { activeScreen, setActiveScreen } = useUiStore();
  const [mounted, setMounted] = useState(false);

  // `activeScreen`/`setActiveScreen` intentionally not in deps — this is a
  // mount-once hydration guard (setMounted) plus a one-time default (land on
  // "dash" if nothing else was already selected, e.g. from persisted UI
  // state). Adding them would turn it into a "run on every screen change"
  // effect instead, fighting the sidebar nav's own setActiveScreen calls
  // every time the user navigates.
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
