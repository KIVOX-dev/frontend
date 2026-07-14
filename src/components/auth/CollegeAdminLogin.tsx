"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function CollegeAdminLogin({ onBack }: { onBack?: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (!email || !password || (isSignUp && !name)) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const payload = { name, email, password, role: "college_admin" };
        await api.post("/auth/register", payload);
        alert("Registration request submitted! Please wait for super admin approval.");
        setIsSignUp(false);
      } else {
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
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: any, message?: string } } };
      let errMsg = "An error occurred.";
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errMsg = error.response.data.detail.map((e: any) => e.msg).join(", ");
        } else if (typeof error.response.data.detail === "string") {
          errMsg = error.response.data.detail === "Incorrect email or password" ? "Invalid password or email" : error.response.data.detail;
        }
      } else if (error?.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="lp-card">
        {onBack && (
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
        )}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-green-gradient mb-6">
            BUDDIES
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Institutional Portal
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            College Administrator Access
          </p>
        </div>

        {error && (
          <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        <div className="l-tabs" style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid var(--border)" }}>
          <button 
            onClick={() => setIsSignUp(false)}
            style={{ flex: 1, background: "none", border: "none", padding: "10px", fontWeight: !isSignUp ? 700 : 500, color: !isSignUp ? "var(--accent)" : "var(--muted)", borderBottom: !isSignUp ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer" }}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsSignUp(true)}
            style={{ flex: 1, background: "none", border: "none", padding: "10px", fontWeight: isSignUp ? 700 : 500, color: isSignUp ? "var(--accent)" : "var(--muted)", borderBottom: isSignUp ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer" }}
          >
            Sign Up
          </button>
        </div>

        {isSignUp ? (
          <div className="l-panel active">
            <label className="lbl">Institution Name</label>
            <input
              type="text"
              className="fi"
              placeholder="Your College Name"
              style={{ marginBottom: "12px" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="lbl">Admin Email</label>
            <input
              type="email"
              className="fi"
              placeholder="admin@college.edu"
              style={{ marginBottom: "12px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="lbl">Password</label>
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
              {loading ? "Registering..." : "Submit Registration Request"}
            </button>
          </div>
        ) : (
          <div className="l-panel active">
            <label className="lbl">Admin Email</label>
            <input
              type="email"
              className="fi"
              placeholder="admin@college.edu"
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
              {loading ? "Signing in..." : "Sign In to Portal"}
            </button>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
