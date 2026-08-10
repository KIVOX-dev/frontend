"use client";

import React, { useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { LoginFields } from "@/components/auth/LoginFields";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

interface LearnerLoginProps {
  initialMode?: "login" | "signup";
}

export function LearnerLogin({ initialMode = "login" }: LearnerLoginProps) {
  const [tab, setTab] = useState<"login" | "signup">(initialMode);

  const { email, setEmail, password, setPassword, error: loginError, setError: setLoginError, loading: loginLoading, login } = useLoginForm();
  const authStoreLogin = useAuthStore((state) => state.login);

  // Signup state — a different field set (role, college) to what login
  // needs, so it stays independent of useLoginForm rather than sharing it.
  const [signupRole] = useState<"student" | "recruiter">("student");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignup = async () => {
    setSignupError("");
    if (!signupName.trim()) return setSignupError("Please enter your name.");
    if (!signupEmail.trim()) return setSignupError("Please enter your email.");
    if (!signupPassword.trim()) return setSignupError("Please choose a password.");
    setSignupLoading(true);
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
        authStoreLogin(
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
      } else {
        setTab("login");
        setSignupError("Registration successful. Please log in.");
      }
    } catch (err: unknown) {
      setSignupError(extractErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setSignupLoading(false);
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
            <LoginFields
              email={email}
              onEmailChange={setEmail}
              emailLabel="Gmail Address"
              emailPlaceholder="name@gmail.com"
              password={password}
              onPasswordChange={setPassword}
              error={loginError}
              loading={loginLoading}
              onSubmit={() => login()}
              submitLabel={
                <>
                  Sign In to Learner Portal
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </>
              }
              loadingLabel="Signing in…"
              forgotPasswordHref="/forgot-password"
              showGoogleLogin
              onGoogleError={setLoginError}
              footer={
                <div className="l-footer" style={{ marginTop: "16px" }}>
                  No account?{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); setTab("signup"); }}>
                    Sign up free
                  </a>
                </div>
              }
            />
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
              disabled={signupLoading}
              style={{ opacity: signupLoading ? 0.7 : 1 }}
            >
              {signupLoading ? "Creating account…" : "Get Started Now"}
              {!signupLoading && (
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
