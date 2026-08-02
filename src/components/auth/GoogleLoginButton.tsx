"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

const SCRIPT_ID = "google-identity-services";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline-solid" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

function loadGsiScript(): Promise<void> {
  if (document.getElementById(SCRIPT_ID)) {
    return window.google ? Promise.resolve() : new Promise((resolve) => {
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
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Callers should gate the "OR" divider that precedes GoogleLoginButton on
 * this too — otherwise an unconfigured client ID leaves the divider
 * dangling above an empty gap instead of hiding the whole Google sign-in
 * option together.
 */
export const isGoogleLoginConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
