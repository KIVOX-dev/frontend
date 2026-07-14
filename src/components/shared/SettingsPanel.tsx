"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function SettingsPanel() {
  const { user, logout } = useAuthStore();
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [msg, setMsg] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.put("/auth/change-password", pwdForm);
      setMsg("Password changed successfully!");
      setPwdForm({ current_password: "", new_password: "" });
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "Failed to change password");
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>Settings</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Manage your account settings.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "800px" }}>
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Profile</h3>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Name</span>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Email</span>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.email}</div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Role</span>
            <div style={{ fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</div>
          </div>
          <button className="btn" onClick={() => { logout(); window.location.href = "/"; }} style={{ marginTop: "12px", color: "#dc2626", borderColor: "#dc2626" }}>
            Log Out
          </button>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text)" }}>Change Password</h3>
          {msg && <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", fontSize: "14px", color: "var(--accent)" }}>{msg}</div>}
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "14px" }}>
              <label className="lbl">Current Password</label>
              <input type="password" className="fi" value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} required />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="lbl">New Password</label>
              <input type="password" className="fi" value={pwdForm.new_password} onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })} required placeholder="Must contain letters and numbers" />
            </div>
            <button type="submit" className="btn btn-p" style={{ width: "100%" }}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
