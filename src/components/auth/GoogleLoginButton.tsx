"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { loadGsiScript, type GoogleCredentialResponse } from "@/lib/googleIdentity";

export { isGoogleLoginConfigured } from "@/lib/googleIdentity";

/**
 * Renders Google's own Sign-In button and exchanges the resulting ID token
 * for a session via POST /auth/google. Silently renders nothing if
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured, so pages using this stay
 * safe to ship before that credential exists.
 */
export function GoogleLoginButton({ onError }: { onError?: (message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const login = useAuthStore((state) => state.login);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      try {
        const res = await api.post("/auth/google", { idToken: response.credential });
        const { user, access_token } = res.data;
        login(
          {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            college_id: user.college_id || user.collegeId,
            college_name: user.college_name,
          },
          access_token
        );
      } catch (err: unknown) {
        onError?.(extractErrorMessage(err, "Google sign-in failed. Please try again."));
      }
    };

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline-solid",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: containerRef.current.offsetWidth || 320,
        });
        setReady(true);
      })
      .catch(() => {
        onError?.("Couldn't load Google sign-in. Check your connection and try again.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div
      className="google-login-btn-container"
      style={{ display: "flex", justifyContent: "center", width: "100%", opacity: ready ? 1 : 0, minHeight: ready ? undefined : 0 }}
    >
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
