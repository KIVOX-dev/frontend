"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function InstitutionalStudentLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [dobPassword, setDobPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (!email || !dobPassword) {
        setError("Enter email and DOB password");
        setLoading(false);
        return;
      }
      const payload = { email, password: dobPassword };
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
      let errMsg = "Invalid password or email";
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errMsg = error.response.data.detail.map((e: any) => e.msg).join(", ");
        } else if (typeof error.response.data.detail === "string") {
          errMsg = error.response.data.detail === "Incorrect email or password" ? "Invalid password or email" : error.response.data.detail;
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
        <div style={{ display: "flex", width: "100%", marginBottom: "16px" }}>
          <button 
            onClick={onBack}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", padding: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-green-gradient mb-6">
            BUDDIES
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Institutional Student Login
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
            Sign in using the credentials provided by your institution.
          </p>
        </div>

        {error && (
          <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        <div className="l-panel active">
          <label className="lbl">College Email</label>
          <input
            type="email"
            className="fi"
            placeholder="student@college.edu"
            style={{ marginBottom: "12px" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <label className="lbl" style={{ marginBottom: 0 }}>Password</label>
          </div>
          <input
            type="password"
            className="fi"
            placeholder="••••••••"
            style={{ marginBottom: "14px" }}
            value={dobPassword}
            onChange={(e) => setDobPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="l-submit l-submit-blue" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Portal"}
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
