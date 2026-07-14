"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function HrLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !company || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        company_name: company,
        password,
        role: "hr",
      });

      const { user, access_token } = res.data;
      login(
        {
          _id: user._id || user.id,
          email: user.email,
          name: user.name || user.full_name,
          role: user.role,
          company_name: user.company_name,
        },
        access_token
      );
    } catch (err: unknown) {
      const error = err as any;
      const data = error?.response?.data;
      const detail = data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(", "));
      } else {
        setError(data?.message || detail || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { user, access_token } = res.data;
      login(
        {
          _id: user._id || user.id,
          email: user.email,
          name: user.name || user.full_name,
          role: user.role,
        },
        access_token
      );
    } catch (err: unknown) {
      const error = err as any;
      const data = error?.response?.data;
      const detail = data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(", "));
      } else {
        setError(data?.message || detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftContent={
        <>
          <div className="lp-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            HR & Recruiter Platform
          </div>
          <div className="lp-title">
            Hire smarter.
            <br />
            Source better.
          </div>
          <div className="lp-sub">
            AI-ranked aptitude profiles, interview scores, and placement-ready talent — all in one recruiter dashboard.
          </div>
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-val">450+</div>
              <div className="lp-stat-lbl">Colleges enrolled</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-val">2.4L+</div>
              <div className="lp-stat-lbl">Scored profiles</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-val">94%</div>
              <div className="lp-stat-lbl">Hire success rate</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-val">30+</div>
              <div className="lp-stat-lbl">Partner companies</div>
            </div>
          </div>
          <div className="lp-avs">
            <div className="lp-av-stack">
              <div className="lp-av">ZO</div>
              <div className="lp-av">TC</div>
              <div className="lp-av">IN</div>
              <div className="lp-av">HX</div>
            </div>
            <span className="lp-av-text">Trusted by top MNC recruiters</span>
          </div>
        </>
      }
    >
      <div className="lp-card">
        {isLogin ? (
          <>
            <div className="lp-heading">
              <h2>HR / Recruiter Login</h2>
              <p>Sign in to access your talent sourcing dashboard</p>
            </div>

            <label className="lbl">Work Email</label>
            <input
              type="email"
              className="fi"
              placeholder="hr@company.com"
              style={{ marginBottom: "12px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <label className="lbl">Password</label>
              <a href="#" style={{ fontSize: "12px", marginBottom: "6px", color: "var(--accent)" }}>
                -?
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
            {error && (
              <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
                {error}
              </div>
            )}
            <button className="l-submit l-submit-blue" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Access HR Dashboard"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
            <div className="or-div" style={{ marginTop: "16px" }}>
              OR
            </div>
            <div className="google-login-btn-container" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              {/* Google Login Placeholder */}
            </div>
            <div className="l-footer">
              New company? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); setError(""); }}>Create Account</a>
            </div>
          </>
        ) : (
          <>
            <div className="lp-heading">
              <h2>Create HR Account</h2>
              <p>Register your company on BUDDIES</p>
            </div>
            <label className="lbl">Full Name</label>
            <input
              type="text"
              className="fi"
              placeholder="John Doe"
              style={{ marginBottom: "12px" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="lbl">Work Email</label>
            <input
              type="email"
              className="fi"
              placeholder="john@company.com"
              style={{ marginBottom: "12px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="lbl">Company Name</label>
            <input
              type="text"
              className="fi"
              placeholder="BUDDIES Global"
              style={{ marginBottom: "12px" }}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <label className="lbl">Create Password</label>
            <input
              type="password"
              className="fi"
              placeholder="••••••••"
              style={{ marginBottom: "14px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            {error && (
              <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
                {error}
              </div>
            )}
            <button className="l-submit l-submit-blue" onClick={handleRegister} disabled={loading}>
              {loading ? "Registering..." : "Register Company"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16,11 18,13 22,9" />
              </svg>
            </button>
            <div className="l-footer">
              Already registered? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); setError(""); }}>Back to Login</a>
            </div>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
