"use client";

import React, { useEffect } from "react";
import { SuperAdminLogin } from "@/components/auth/SuperAdminLogin";
import { useAuthStore } from "@/stores/authStore";
import { OFFLINE_TOKEN } from "@/lib/sampleAuth";

import { SuperAdminDashboard } from "@/components/superadmin/SuperAdminDashboard";

export default function SuperAdminPage() {
  const { isAuthenticated, user, token, logout } = useAuthStore();

  /* A persisted offline-fallback session outlives the reload that would
     otherwise send us back to the login screen, and its token can never talk
     to the API — every request 401s. Drop it so a real token can be minted. */
  const isStale = token === OFFLINE_TOKEN;

  useEffect(() => {
    if (isStale) logout();
  }, [isStale, logout]);

  if (!isAuthenticated || user?.role !== "super_admin" || isStale) {
    return <SuperAdminLogin />;
  }

  return (
    <div className="h-screen bg-paper-tint/50 py-12 overflow-y-auto">
      <SuperAdminDashboard />
    </div>
  );
}
