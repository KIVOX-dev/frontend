"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Logo } from "@/components/shared/Logo";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

type Status = "verifying" | "success" | "error";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState("This verification link is missing its token.");
  // GET /auth/verify-email is not idempotent-safe to call twice in dev's
  // StrictMode double-effect (a second call would hit an already-consumed
  // token and report the link as expired even though the first call succeeded).
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    api
      .get("/auth/verify-email", { params: { token } })
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setErrorMessage(extractErrorMessage(err, "This verification link is invalid or has expired."));
        setStatus("error");
      });
  }, [token]);

  return (
    <AuthSplitLayout season="summer">
      <div className="lp-card">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="flex justify-center mb-6">
            <Logo variant="brand" height={72} priority />
          </div>

          {status === "verifying" && (
            <>
              <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
                Verifying your email...
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>This will only take a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
                Email verified
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Your email address has been confirmed. You&apos;re all set.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 style={{ fontSize: "24px", color: "var(--text)", fontWeight: 700, marginBottom: "8px" }}>
                Verification failed
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>{errorMessage}</p>
            </>
          )}
        </div>

        {status !== "verifying" && (
          <Link
            href="/"
            className="l-submit l-submit-blue"
            style={{ width: "100%", display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Go to login
          </Link>
        )}
      </div>
    </AuthSplitLayout>
  );
}
