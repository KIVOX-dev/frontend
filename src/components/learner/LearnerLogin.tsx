"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

interface LearnerLoginProps {
  initialMode?: "login" | "signup";
}

export function LearnerLogin({ initialMode = "login" }: LearnerLoginProps) {
  const [tab, setTab] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [signupRole, setSignupRole] = useState<"student" | "recruiter">("student");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCollege, setSignupCollege] = useState("");
  const [signupError, setSignupError] = useState("");

  const { login } = useAuthStore();

  const handleLogin = async () => {
    setLoginError("");
    if (!email.trim() || !password.trim()) {
      return setLoginError("Please enter your email and password.");
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, user } = res.data;
      login(
        {
          _id: user._id || user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          college_id: user.college_id || user.collegeId,
          college_name: user.college_name,
        },
        access_token
      );
    } catch (err: unknown) {
      const error = err as any;
      const detail = error?.response?.data?.detail || error?.response?.data?.message;
      if (Array.isArray(detail)) {
        setLoginError(detail.map((e: any) => e.msg).join(", "));
      } else {
        const defaultMsg = typeof detail === "string" ? detail : "Invalid password or email";
        setLoginError(defaultMsg === "Incorrect email or password" ? "Invalid password or email" : defaultMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setSignupError("");
    if (!signupName.trim()) return setSignupError("Please enter your name.");
    if (!signupEmail.trim()) return setSignupError("Please enter your email.");
    if (!signupPassword.trim()) return setSignupError("Please choose a password.");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
      });

      const payload = res.data;
      const user = payload.user || payload.data?.user;
      const access_token = payload.access_token || payload.data?.token || payload.token;

      if (access_token && user) {
        login(
          {
            _id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            college_id: user.college_id || user.collegeId,
            college_name: user.college_name,
          },
          access_token
        );
      } else {
        setTab("login");
        setSignupError("Registration successful. Please log in.");
      }
    } catch (err: unknown) {
      const error = err as any;
      const detail = error?.response?.data?.detail || error?.response?.data?.message;
      if (Array.isArray(detail)) {
        setSignupError(detail.map((e: any) => e.msg).join(", "));
      } else {
        setSignupError(typeof detail === "string" ? detail : "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="lp-card">
        {/* Tab switcher */}
        <div className="l-tabs">
          <button
            className={`l-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Sign In
          </button>
          <button
            className={`l-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => setTab("signup")}
          >
            Sign Up Free
          </button>
        </div>

        {/* ─── LOGIN PANEL ─── */}
        {tab === "login" && (
          <div className="l-panel active">
            <div className="lp-heading">
              <h2>Learner Login</h2>
              <p>Sign in to continue your aptitude journey</p>
            </div>
            <label className="lbl">Gmail Address</label>
            <input
              type="email"
              className="fi"
              placeholder="name@gmail.com"
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
            {loginError && (
              <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
                {loginError}
              </div>
            )}
            <button
              className="l-submit l-submit-blue"
              onClick={handleLogin}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In to Learner Portal"}
              {!loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              )}
            </button>
            <div className="l-footer" style={{ marginTop: "16px" }}>
              No account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setTab("signup"); }}>
                Sign up free
              </a>
            </div>
          </div>
        )}

        {/* ─── SIGNUP PANEL ─── */}
        {tab === "signup" && (
          <div className="l-panel active">
            <div className="lp-heading">
              <h2>Create Account</h2>
              <p>Start your AI-powered placement journey today</p>
            </div>

            {/* Role Selection Tabs Removed */}

            <label className="lbl">Username</label>
            <input
              type="text"
              className="fi"
              placeholder="Your name"
              style={{ marginBottom: "12px" }}
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
            />
            <label className="lbl">Email Address</label>
            <input
              type="email"
              className="fi"
              placeholder="name@gmail.com"
              style={{ marginBottom: "12px" }}
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />

            <label className="lbl">Password</label>
            <input
              type="password"
              className="fi"
              placeholder="••••••••"
              style={{ marginBottom: "14px" }}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
            {signupError && (
              <div className="auth-warn" style={{ display: "block", marginBottom: "12px" }}>
                {signupError}
              </div>
            )}
            <button
              className="l-submit l-submit-blue"
              onClick={handleSignup}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating account…" : "Get Started Now"}
              {!loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              )}
            </button>
            <div className="l-footer" style={{ marginTop: "16px" }}>
              Already have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setTab("login"); }}>
                Sign in
              </a>
            </div>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
