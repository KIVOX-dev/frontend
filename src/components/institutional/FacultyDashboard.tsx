"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { UserPlus, InboxArrowUp, ChartSimple } from "./dazzleIcons";

export function FacultyDashboard() {
  const { user } = useAuthStore();
  const { setActiveScreen } = useUiStore();
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwdMessage, setPwdMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    try {
      await api.put("/auth/change-password", {
        current_password: pwdForm.currentPassword,
        new_password: pwdForm.newPassword
      });
      setPwdMessage({ text: "Password changed successfully!", ok: true });
      setPwdForm({ currentPassword: "", newPassword: "" });
    } catch (err: unknown) {
      setPwdMessage({ text: extractErrorMessage(err, "Failed to change password."), ok: false });
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Faculty Portal</h2>
        <p style={{ color: "var(--muted)" }}>Welcome back, {user?.name}. Manage your students and account settings.</p>
      </div>

      {/* Quick Access Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Add Student", desc: "Create a new student account", icon: UserPlus, screen: "add-student", color: "#4f46e5" },
          { label: "Upload Students", desc: "Bulk import via CSV", icon: InboxArrowUp, screen: "upload", color: "#0891b2" },
          { label: "Student Tracking", desc: "View student performance", icon: ChartSimple, screen: "tracking", color: "#7c3aed" },
        ].map(card => (
          <div
            key={card.screen}
            className="card"
            onClick={() => setActiveScreen(card.screen)}
            style={{ padding: "24px", cursor: "pointer", borderLeft: `4px solid ${card.color}`, transition: "transform 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ marginBottom: "8px" }}>
              <card.icon size={28} style={{ color: card.color }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "4px" }}>{card.label}</div>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="card" style={{ padding: "28px", maxWidth: "460px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>Change Password</h3>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
          Update the temporary password provided by your institution admin.
        </p>
        {pwdMessage && (
          <div style={{ padding: "10px 14px", marginBottom: "16px", background: pwdMessage.ok ? "#e6f4ea" : "#fee2e2", color: pwdMessage.ok ? "#1e8e3e" : "#dc2626", borderRadius: "8px", fontSize: "14px" }}>
            {pwdMessage.text}
          </div>
        )}
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: "16px" }}>
            <label className="lbl">Current Password</label>
            <input type="password" className="fi" value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} required />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label className="lbl">New Password</label>
            <input type="password" className="fi" value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required placeholder="Must contain letters and numbers" />
          </div>
          <button type="submit" className="btn btn-g">Update Password</button>
        </form>
      </div>
    </div>
  );
}
