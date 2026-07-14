"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (!email || !password) {
        setError("Enter credentials");
        setLoading(false);
        return;
      }
      const payload = { email, password };
      const res = await api.post("/auth/login", payload);

      const { user, access_token } = res.data;
      login(
        {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          college_id: user.college_id || user.collegeId,
        },
        access_token
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: any } } };
      let errMsg = "Invalid credentials. Please try again.";
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errMsg = error.response.data.detail.map((e: any) => e.msg).join(", ");
        } else if (typeof error.response.data.detail === "string") {
          errMsg = error.response.data.detail;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img
            src="/buddies-logo.jpg"
            alt="BUDDIES"
            style={{ height: "50px", marginBottom: "20px", borderRadius: "8px" }}
          />
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Super Admin Portal
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Authorized Personnel Only
          </p>
        </div>

        {error && (
          <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        <div className="l-panel active">
          <label className="lbl">Admin Email</label>
          <input
            type="email"
            className="fi"
            placeholder="admin@buddies.com"
            style={{ marginBottom: "12px" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <label className="lbl" style={{ marginBottom: 0 }}>Password</label>
            <a href="/forgot-password" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 500, marginBottom: "8px" }}>
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            className="fi"
            placeholder="••••••••"
            style={{ marginBottom: "14px" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="l-submit l-submit-blue" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>
            {loading ? "Authenticating..." : "Secure Login"}
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
