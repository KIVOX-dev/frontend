"use client";

import React from "react";
import { GoogleLoginButton, isGoogleLoginConfigured } from "@/components/auth/GoogleLoginButton";

// The repeated email/password/submit/error/Google-divider block shared by
// every role's login form (see useLoginForm.ts for the state/submit half of
// this same consolidation, FULL_STACK_AUDIT_REPORT.md FE-008). Deliberately
// does NOT own the surrounding heading, back button, or tab chrome — those
// differ enough per role (plain centered title vs. `.lp-heading` vs. tab
// bar, optional Back button, custom AuthSplitLayout leftContent) that
// forcing them through one prop surface would trade six small duplicated
// components for one large branchy one. Pages keep that chrome themselves
// and render this for the actual form fields.
export interface LoginFieldsProps {
  email: string;
  onEmailChange: (value: string) => void;
  emailLabel?: string;
  emailPlaceholder?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordLabel?: string;
  error: string;
  loading: boolean;
  onSubmit: () => void;
  submitLabel: React.ReactNode;
  loadingLabel: React.ReactNode;
  /** Omit to hide the link entirely (e.g. institutional-student login, whose
   * "password" is a DOB issued by the institution, not self-service resettable). */
  forgotPasswordHref?: string;
  showGoogleLogin?: boolean;
  onGoogleError?: (message: string) => void;
  /** Rendered below the submit/Google block — e.g. a "New here? Sign up" link. */
  footer?: React.ReactNode;
}

export function LoginFields({
  email, onEmailChange, emailLabel = "Email", emailPlaceholder = "you@example.com",
  password, onPasswordChange, passwordLabel = "Password",
  error, loading, onSubmit, submitLabel, loadingLabel,
  forgotPasswordHref, showGoogleLogin = false, onGoogleError, footer,
}: LoginFieldsProps) {
  return (
    <>
      {error && (
        <div className="auth-warn" role="alert" style={{ display: "block", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      <label className="lbl">{emailLabel}</label>
      <input
        type="email"
        className="fi"
        placeholder={emailPlaceholder}
        style={{ marginBottom: "12px" }}
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        autoComplete="email"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <label className="lbl" style={{ marginBottom: 0 }}>{passwordLabel}</label>
        {forgotPasswordHref && (
          <a
            href={forgotPasswordHref}
            style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 500, marginBottom: "8px" }}
          >
            Forgot password?
          </a>
        )}
      </div>
      <input
        type="password"
        className="fi"
        placeholder="••••••••"
        style={{ marginBottom: "14px" }}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        autoComplete="current-password"
      />

      <button className="l-submit l-submit-blue" style={{ width: "100%" }} onClick={onSubmit} disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </button>

      {showGoogleLogin && isGoogleLoginConfigured && (
        <>
          <div className="or-div" style={{ marginTop: "16px" }}>
            OR
          </div>
          <GoogleLoginButton onError={onGoogleError} />
        </>
      )}

      {footer}
    </>
  );
}
