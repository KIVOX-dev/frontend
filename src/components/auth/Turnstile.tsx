"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (document.getElementById(SCRIPT_ID)) {
    return window.turnstile
      ? Promise.resolve()
      : new Promise((resolve) => {
          document.getElementById(SCRIPT_ID)!.addEventListener("load", () => resolve());
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cloudflare Turnstile"));
    document.head.appendChild(script);
  });
}

/** Callers should treat a missing token as "not yet verified" and disable
 * submission accordingly — the backend rejects register/forgot-password
 * requests without a valid token regardless (see node-api's
 * middlewares/verifyTurnstile.js), so this only affects client-side UX. */
export const isTurnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileProps {
  /** Must match the `action` the backend's verifyTurnstile(...) middleware
   * expects for this route (see node-api's src/routes/auth.routes.js). */
  action: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

/**
 * Renders Cloudflare Turnstile and reports the resulting token via onVerify.
 * Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't configured (see
 * isTurnstileConfigured) — same pattern as GoogleLoginButton's
 * isGoogleLoginConfigured.
 */
// Above this, the script/render call is treated as stuck — covers a CSP
// script-src or frame-src block silently swallowing the load (some browsers
// never fire the <script> tag's own onerror for a CSP violation), an ad
// blocker/privacy extension killing the request, or a genuine Cloudflare
// outage. Without this, "never resolves" and "working normally" look
// identical to this component, and the container stays invisible forever
// (see the incident this was added for: CSP didn't allow
// challenges.cloudflare.com, the widget never rendered, and the only visible
// symptom was the submit button silently refusing to work with no
// explanation on the page).
const LOAD_TIMEOUT_MS = 8000;

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { action, onVerify, onExpire, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setStatus((current) => (current === "loading" ? "error" : current));
      onError?.();
    }, LOAD_TIMEOUT_MS);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => {
            setStatus("error");
            onError?.();
          },
        });
        clearTimeout(timeoutId);
        setStatus("ready");
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setStatus("error");
        onError?.();
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, action]);

  if (!siteKey) return null;

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        ref={containerRef}
        style={{ opacity: status === "ready" ? 1 : 0, minHeight: status === "ready" ? undefined : 0 }}
      />
      {status === "loading" && (
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading verification…</p>
      )}
      {status === "error" && (
        <p style={{ fontSize: "13px", color: "var(--red, #d92d20)" }}>
          Verification widget failed to load. Disable any ad blocker/privacy extension for this
          site and refresh the page, or try again shortly.
        </p>
      )}
    </div>
  );
});
