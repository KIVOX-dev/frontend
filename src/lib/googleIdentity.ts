// Shared by GoogleLoginButton.tsx (sign in/up) and GoogleAccountRow.tsx
// (Settings' "Connect Google account" row) — both need Google Identity
// Services' button-rendering flow, differing only in which endpoint the
// resulting ID token gets POSTed to.
const SCRIPT_ID = "google-identity-services";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export interface GoogleCredentialResponse {
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

export function loadGsiScript(): Promise<void> {
  if (document.getElementById(SCRIPT_ID)) {
    return window.google
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
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Callers should gate any Google sign-in/connect UI on this — an
 * unconfigured client ID means Google Identity Services has nothing to
 * authenticate against, so the whole feature should render as absent rather
 * than a dead button.
 */
export const isGoogleLoginConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
