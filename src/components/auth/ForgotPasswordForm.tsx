"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { Turnstile, isTurnstileConfigured, TurnstileHandle } from "@/components/auth/Turnstile";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

// Backend contract (node-api auth.controller.js#forgotPassword /
// auth.service.js#forgotPassword): always responds 200 with a generic
// message whether or not the email belongs to an account — this form must
// never itself say anything more specific ("no account with that email"),
// or it would reintroduce the account-enumeration hole the backend was
// deliberately built to avoid. The only states this form distinguishes are
// operational (validation / rate limit / network failure), never "does this
// account exist".
const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, we've sent password reset instructions to it. The link expires in 15 minutes.";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    if (isTurnstileConfigured && !turnstileToken) {
      setSubmitError("Please complete the verification challenge.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: trimmed, turnstileToken });
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(extractErrorMessage(err, "Something went wrong. Please try again."));
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout season="summer">
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="flex justify-center mb-6">
            <Logo variant="brand" height={72} priority />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Reset your password
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Enter the email on your account and we&apos;ll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div>
            <div
              role="status"
              style={{
                background: "var(--accent-l, #e6f0ff)",
                border: "1px solid rgba(1, 69, 242, .2)",
                borderRadius: "var(--r2, 10px)",
                padding: "16px",
                marginBottom: "16px",
                color: "var(--text)",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {GENERIC_SUCCESS_MESSAGE}
            </div>
            <button
              type="button"
              className="l-submit l-submit-blue"
              style={{ width: "100%", marginBottom: "12px" }}
              onClick={() => {
                setSubmitted(false);
                setEmail("");
              }}
            >
              Send to a different email
            </button>
            <Link
              href="/"
              style={{ display: "block", textAlign: "center", fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="l-panel active">
            {submitError && (
              <div className="auth-warn" role="alert">
                {submitError}
              </div>
            )}
            <label className="lbl" htmlFor="forgot-password-email">
              Email
            </label>
            <input
              id="forgot-password-email"
              type="email"
              className="fi"
              placeholder="you@example.com"
              style={{ marginBottom: fieldError ? "6px" : "20px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "forgot-password-email-error" : undefined}
              autoComplete="email"
              autoFocus
            />
            {fieldError && (
              <p id="forgot-password-email-error" role="alert" style={{ color: "var(--red)", fontSize: "12px", marginBottom: "14px" }}>
                {fieldError}
              </p>
            )}
            <Turnstile
              ref={turnstileRef}
              action="forgot_password"
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
            />
            <button
              type="submit"
              className="l-submit l-submit-blue"
              style={{ width: "100%", marginBottom: "16px" }}
              disabled={loading || (isTurnstileConfigured && !turnstileToken)}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <Link
              href="/"
              style={{ display: "block", textAlign: "center", fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
            >
              ← Back to login
            </Link>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
