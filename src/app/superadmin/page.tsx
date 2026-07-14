"use client";

import React from "react";
import { SuperAdminLogin } from "@/components/auth/SuperAdminLogin";
import { useAuthStore } from "@/stores/authStore";

import { SuperAdminDashboard } from "@/components/superadmin/SuperAdminDashboard";

export default function SuperAdminPage() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== "super_admin") {
    return <SuperAdminLogin />;
  }

  return (
    <div className="h-screen bg-gray-50/50 py-12 overflow-y-auto">
      <SuperAdminDashboard />
    </div>
  );
}
