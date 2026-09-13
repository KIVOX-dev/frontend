"use client";

import React from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { LoginFields } from "@/components/auth/LoginFields";
import { useLoginForm } from "@/hooks/useLoginForm";

export function SuperAdminLogin() {
  /* Exchange whatever was typed for a real JWT. There is no offline fallback
     here on purpose: a fake session that looks logged in but can never fetch
     real data just hides the actual failure — every request after it 401s
     silently instead of surfacing "please log in again". If the backend is
     unreachable, that has to be a visible error, not a session. */
  const {
    email, setEmail, password, setPassword, error, loading, login,
    turnstileRef, setTurnstileToken, turnstileDisabled,
  } = useLoginForm({
    fallbackErrorMessage: "Invalid credentials. Please try again.",
  });

  return (
    <AuthSplitLayout season="night">
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <Logo variant="brand" height={75} priority />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Super Admin Portal
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Authorized Personnel Only
          </p>
        </div>

        <div className="l-panel active">
          <LoginFields
            email={email}
            onEmailChange={setEmail}
            emailLabel="Admin Email"
            emailPlaceholder="admin@talentsnaps.ai"
            password={password}
            onPasswordChange={setPassword}
            error={error}
            loading={loading}
            onSubmit={() => login()}
            submitLabel="Secure Login"
            loadingLabel="Authenticating..."
            forgotPasswordHref="/forgot-password"
            turnstileRef={turnstileRef}
            onTurnstileVerify={setTurnstileToken}
            disabled={turnstileDisabled}
          />
        </div>
      </div>
    </AuthSplitLayout>
  );
}
