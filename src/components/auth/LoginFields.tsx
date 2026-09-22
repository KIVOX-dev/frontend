"use client";

import React from "react";
import { GoogleLoginButton, isGoogleLoginConfigured } from "@/components/auth/GoogleLoginButton";
import { Turnstile, TurnstileHandle } from "@/components/auth/Turnstile";

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
  /** Omit to hide the link entirely. */
  forgotPasswordHref?: string;
  showGoogleLogin?: boolean;
  onGoogleError?: (message: string) => void;
  /** Rendered below the submit/Google block — e.g. a "New here? Sign up" link. */
  footer?: React.ReactNode;
  /** Cloudflare Turnstile — pass the fields useLoginForm() returns
   * (turnstileRef/turnstileToken/setTurnstileToken) to render the widget
   * above the submit button. Omit to render no widget at all. */
  turnstileRef?: React.Ref<TurnstileHandle>;
  onTurnstileVerify?: (token: string) => void;
  /** Extra disable condition beyond `loading` (e.g. Turnstile not yet
   * verified) — kept separate from `loading` so the button doesn't show
   * loadingLabel just because the challenge isn't done yet. */
  disabled?: boolean;
}

export function LoginFields({
  email, onEmailChange, emailLabel = "Email", emailPlaceholder = "you@example.com",
  password, onPasswordChange, passwordLabel = "Password",
  error, loading, onSubmit, submitLabel, loadingLabel,
  forgotPasswordHref, showGoogleLogin = false, onGoogleError, footer,
  turnstileRef, onTurnstileVerify, disabled = false,
}: LoginFieldsProps) {
  const [showPassword, setShowPassword] = React.useState(false);

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
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <input
          type={showPassword ? "text" : "password"}
          className="fi"
          placeholder="••••••••"
          style={{ paddingRight: "40px", width: "100%" }}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            color: "var(--muted)",
          }}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {onTurnstileVerify && (
        <Turnstile
          ref={turnstileRef}
          action="login"
          onVerify={onTurnstileVerify}
          onExpire={() => onTurnstileVerify("")}
        />
      )}

      <button className="l-submit l-submit-blue" style={{ width: "100%" }} onClick={onSubmit} disabled={loading || disabled}>
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
