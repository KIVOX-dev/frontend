"use client";

import React from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { LoginFields } from "@/components/auth/LoginFields";
import { useLoginForm } from "@/hooks/useLoginForm";

export function FacultyLogin({ onBack }: { onBack?: () => void }) {
  const {
    email, setEmail, password, setPassword, error, setError, loading, login,
    turnstileRef, setTurnstileToken, turnstileDisabled,
  } = useLoginForm();

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
            Faculty Portal
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Sign in to manage your students
          </p>
        </div>

        <div className="l-panel active">
          <LoginFields
            email={email}
            onEmailChange={setEmail}
            emailLabel="Staff Email"
            emailPlaceholder="faculty@college.edu"
            password={password}
            onPasswordChange={setPassword}
            error={error}
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
      </div>
    </AuthSplitLayout>
  );
}
