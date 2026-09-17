"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { loadGsiScript, isGoogleLoginConfigured, type GoogleCredentialResponse } from "@/lib/googleIdentity";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.998 11.998 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A11.998 11.998 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A11.998 11.998 0 0 0 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

type GoogleUser = { google_id?: string | null; google_email?: string | null; google_connected_at?: string | null };

/**
 * Settings' "Connect with social accounts" row — real Google account
 * linking (POST /auth/google/link, DELETE /auth/google/unlink), reusing the
 * same Google Identity Services button-rendering flow as GoogleLoginButton.tsx
 * (see lib/googleIdentity.ts), just pointed at a different, authenticated
 * endpoint. Renders nothing if NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured.
 */
export function GoogleAccountRow() {
  const { user, updateUser } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonReady, setButtonReady] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const googleUser = user as (typeof user & GoogleUser) | null;
  const connected = !!googleUser?.google_id;

  useEffect(() => {
    if (!clientId || connected) return;

    let cancelled = false;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      setLinking(true);
      setError("");
      try {
        const res = await api.post<{ user: GoogleUser }>("/auth/google/link", { idToken: response.credential });
        updateUser(res.data.user);
      } catch (err: unknown) {
        setError(extractErrorMessage(err, "Couldn't connect Google account"));
      } finally {
        setLinking(false);
      }
    };

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline-solid",
          size: "medium",
          shape: "rectangular",
          text: "continue_with",
          width: containerRef.current.offsetWidth || 240,
        });
        setButtonReady(true);
      })
      .catch(() => setError("Couldn't load Google sign-in. Check your connection and try again."));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, connected]);

  const handleUnlink = async () => {
    if (!window.confirm("Disconnect your Google account?")) return;
    setUnlinking(true);
    setError("");
    try {
      const res = await api.delete<{ user: GoogleUser }>("/auth/google/unlink");
      updateUser(res.data.user);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't disconnect Google account"));
    } finally {
      setUnlinking(false);
    }
  };

  if (!isGoogleLoginConfigured) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
        <div className="flex items-center gap-3 min-w-0">
          <GoogleIcon className="size-6 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">Google</p>
            <p className="text-small truncate">
              {connected
                ? [googleUser?.google_email, googleUser?.google_connected_at ? `Connected ${new Date(googleUser.google_connected_at).toLocaleDateString()}` : null]
                    .filter(Boolean)
                    .join(" · ")
                : "Sign in faster with your Google account."}
            </p>
          </div>
        </div>
        {connected ? (
          <Button variant="secondary" size="sm" onClick={handleUnlink} loading={unlinking} className="shrink-0">
            Disconnect
          </Button>
        ) : (
          <div className="shrink-0" style={{ opacity: buttonReady ? 1 : 0, minHeight: buttonReady ? undefined : 0 }}>
            <div ref={containerRef} />
          </div>
        )}
      </div>
      {linking && <p className="text-small mt-2">Connecting…</p>}
      {error && <p className="text-small text-danger mt-2">{error}</p>}
    </div>
  );
}
