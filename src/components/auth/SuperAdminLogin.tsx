"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

export function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  /* Exchange whatever was typed for a real JWT. There is no offline fallback
     here on purpose: a fake session that looks logged in but can never fetch
     real data just hides the actual failure — every request after it 401s
     silently instead of surfacing "please log in again". If the backend is
     unreachable, that has to be a visible error, not a session. */
  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Enter credentials");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, access_token } = res.data;
      login(
        {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          college_id: user.college_id || user.collegeId,
          college_name: user.college_name,
        },
        access_token
      );
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Invalid credentials. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <Logo variant="full" height={50} priority />
          </div>
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
            placeholder="admin@upscaler.ai"
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
