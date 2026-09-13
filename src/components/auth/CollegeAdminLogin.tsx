"use client";

import React, { useRef, useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { LoginFields } from "@/components/auth/LoginFields";
import { Turnstile, isTurnstileConfigured, TurnstileHandle } from "@/components/auth/Turnstile";
import { useLoginForm } from "@/hooks/useLoginForm";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

export function CollegeAdminLogin({ onBack }: { onBack?: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [registerTurnstileToken, setRegisterTurnstileToken] = useState("");
  const registerTurnstileRef = useRef<TurnstileHandle>(null);

  // Shared with the sign-in panel below — switching tabs deliberately keeps
  // whatever email/password was already typed, matching this form's
  // original behavior.
  const {
    email, setEmail, password, setPassword, error, setError, loading, setLoading, login,
    turnstileRef, setTurnstileToken, turnstileDisabled,
  } = useLoginForm();

  const handleRegister = async () => {
    setError("");
    if (!email || !password || !name) {
      setError("Please fill in all fields.");
      return;
    }
    if (isTurnstileConfigured && !registerTurnstileToken) {
      setError("Please complete the verification challenge.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, role: "college_admin", turnstileToken: registerTurnstileToken };
      if (phone.trim()) payload.phone = phone.trim();
      await api.post("/auth/register", payload);
      toast.success("Registration request submitted!", "Please wait for super admin approval.");
      setIsSignUp(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "An error occurred."));
      registerTurnstileRef.current?.reset();
      setRegisterTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout season="winter">
      <div className="lp-card">
        {onBack && (
          <div style={{ display: "flex", width: "100%", marginBottom: "16px" }}>
            <button
              onClick={onBack}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", padding: 0 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="flex justify-center mb-6">
            <Logo variant="brand" height={72} priority />
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
            <label className="lbl">Phone Number (optional)</label>
            <input
              type="tel"
              className="fi"
              placeholder="+91 98765 43210"
              style={{ marginBottom: "12px" }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="lbl">Password</label>
            <input
              type="password"
              className="fi"
              placeholder="••••••••"
              style={{ marginBottom: "14px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            <Turnstile
              ref={registerTurnstileRef}
              action="register"
              onVerify={setRegisterTurnstileToken}
              onExpire={() => setRegisterTurnstileToken("")}
            />
            <button
              className="l-submit l-submit-blue"
              style={{ width: "100%" }}
              onClick={handleRegister}
              disabled={loading || (isTurnstileConfigured && !registerTurnstileToken)}
            >
              {loading ? "Registering..." : "Submit Registration Request"}
            </button>
          </div>
        ) : (
          <div className="l-panel active">
            <LoginFields
              email={email}
              onEmailChange={setEmail}
              emailLabel="Admin Email"
              emailPlaceholder="admin@college.edu"
              password={password}
              onPasswordChange={setPassword}
              error=""
              loading={loading}
              onSubmit={() => login()}
              submitLabel="Sign In to Portal"
              loadingLabel="Signing in..."
              forgotPasswordHref="/forgot-password"
              showGoogleLogin
              onGoogleError={setError}
              turnstileRef={turnstileRef}
              onTurnstileVerify={setTurnstileToken}
              disabled={turnstileDisabled}
            />
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
