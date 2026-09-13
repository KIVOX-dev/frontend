"use client";

import React from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { LoginFields } from "@/components/auth/LoginFields";
import { useLoginForm } from "@/hooks/useLoginForm";

export function InstitutionalStudentLogin({ onBack }: { onBack: () => void }) {
  const {
    email, setEmail, password, setPassword, error, setError, loading, login,
    turnstileRef, setTurnstileToken, turnstileDisabled,
  } = useLoginForm({
    fallbackErrorMessage: "Invalid password or email",
  });

  return (
    <AuthSplitLayout season="winter">
      <div className="lp-card">
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
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="flex justify-center mb-6">
            <Logo variant="brand" height={48} priority />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Institutional Student Login
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
            Sign in using the credentials provided by your institution.
          </p>
        </div>

        <div className="l-panel active">
          <LoginFields
            email={email}
            onEmailChange={setEmail}
            emailLabel="College Email"
            emailPlaceholder="student@college.edu"
            password={password}
            onPasswordChange={setPassword}
            error={error}
            loading={loading}
            onSubmit={() => login()}
            submitLabel="Sign In to Portal"
            loadingLabel="Signing in..."
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
