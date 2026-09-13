"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

// Mirrors resetPassword's Joi schema (auth.validation.js): min 8 chars.
const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  if (!token) {
    return (
      <AuthSplitLayout season="summer">
        <div className="lp-card">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="flex justify-center mb-6">
              <Logo variant="brand" height={48} priority />
            </div>
            <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
              Invalid reset link
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              This password reset link is missing its token. Request a new one below.
            </p>
          </div>
          <Link href="/forgot-password" className="l-submit l-submit-blue" style={{ width: "100%", display: "block", textAlign: "center", textDecoration: "none" }}>
            Request a new link
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFieldError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("Passwords don't match.");
      return;
    }
    setFieldError("");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setSucceeded(true);
    } catch (err: unknown) {
      // Backend returns the same "invalid or expired" message for a wrong,
      // reused, or stale token — see auth.service.js#resetPassword — so no
      // further distinction is made here either.
      setSubmitError(extractErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <AuthSplitLayout season="summer">
        <div className="lp-card">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="flex justify-center mb-6">
              <Logo variant="brand" height={48} priority />
            </div>
            <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
              Password updated
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              Your password has been reset. You&apos;ve been signed out of every other session — log in again with your
              new password.
            </p>
          </div>
          <Link href="/" className="l-submit l-submit-blue" style={{ width: "100%", display: "block", textAlign: "center", textDecoration: "none" }}>
            Go to login
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  const isExpiredOrInvalidToken = /invalid or has expired/i.test(submitError);

  return (
    <AuthSplitLayout season="summer">
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="flex justify-center mb-6">
            <Logo variant="brand" height={48} priority />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
            Choose a new password
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="l-panel active">
          {submitError && (
            <div className="auth-warn" role="alert">
              {submitError}
              {isExpiredOrInvalidToken && (
                <>
                  {" "}
                  <Link href="/forgot-password" style={{ color: "var(--accent)", fontWeight: 600 }}>
                    Request a new link
                  </Link>
                </>
              )}
            </div>
          )}
          <label className="lbl" htmlFor="reset-password-new">
            New password
          </label>
          <input
            id="reset-password-new"
            type="password"
            className="fi"
            placeholder="••••••••"
            style={{ marginBottom: "12px" }}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          <label className="lbl" htmlFor="reset-password-confirm">
            Confirm new password
          </label>
          <input
            id="reset-password-confirm"
            type="password"
            className="fi"
            placeholder="••••••••"
            style={{ marginBottom: fieldError ? "6px" : "20px" }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {fieldError && (
            <p role="alert" style={{ color: "var(--red)", fontSize: "12px", marginBottom: "14px" }}>
              {fieldError}
            </p>
          )}
          <button type="submit" className="l-submit l-submit-blue" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
