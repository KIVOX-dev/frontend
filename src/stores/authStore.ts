import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiUrl } from '@/lib/apiUrl';

interface User {
  _id?: string;
  id?: string | number;
  email: string;
  name: string;
  role: string;          // 'student' | 'faculty' | 'college_admin' | 'super_admin' | 'recruiter'
  college_id?: string;
  institution_id?: string;
  college_name?: string;
  company_name?: string;
  company?: string;
  rollNumber?: string;
  department?: string;
  year?: number;
  [key: string]: unknown; // allow extra fields from backend
}

interface AuthState {
  user: User | null;
  // Memory only, never persisted: a new tab or reload gets a fresh one from
  // POST /auth/refresh, which reads the httpOnly refresh cookie (see api.ts).
  // Nothing in localStorage is a credential any more, so an XSS bug can't
  // carry a session off the device.
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const PERSIST_KEY = 'upscaler-ai-auth';

// Where tokens lived before the refresh cookie. Access tokens are dropped on
// load; api.ts sends a leftover refresh token once so the server can move it
// into the cookie, then deletes it.
const LEGACY_TOKEN_KEYS = ['upscaler_ai_token', 'sk_token'];
export const LEGACY_REFRESH_TOKEN_KEY = 'upscaler_ai_refresh_token';

function clearLegacyTokens({ includeRefresh }: { includeRefresh: boolean }) {
  try {
    LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
    if (includeRefresh) localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  } catch {
    // Storage blocked — nothing to clear.
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        clearLegacyTokens({ includeRefresh: true });
        // Only the server can clear the httpOnly refresh cookie. keepalive so
        // the request still goes out when logout is followed by a reload.
        fetch(`${getApiUrl()}/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {});
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        })),
    }),
    {
      name: PERSIST_KEY, // persisted key in localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Version 0 persisted the access token as well; drop it.
      version: 1,
      migrate: (persisted) => {
        const { token: _dropped, ...rest } = (persisted || {}) as Partial<AuthState>;
        return rest as AuthState;
      },
    }
  )
);

if (typeof window !== 'undefined') clearLegacyTokens({ includeRefresh: false });

// localStorage is shared across every tab of this origin, so logging into a
// DIFFERENT account in one tab changes the persisted user every other open
// tab reads from, and the refresh cookie is shared too — a still-open tab
// would keep rendering its own (now-stale) account while its next refresh
// hands it someone else's token.
// The 'storage' event fires in every OTHER tab (never the one that made the
// change), so on a genuine account switch reload so the tab re-hydrates onto
// whichever session is now actually current.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== PERSIST_KEY || !event.newValue) return;
    try {
      const incomingUser = JSON.parse(event.newValue)?.state?.user;
      const currentUser = useAuthStore.getState().user;
      const incomingIdentity = incomingUser?.id ?? incomingUser?.email ?? null;
      const currentIdentity = currentUser?.id ?? currentUser?.email ?? null;
      if (incomingIdentity !== currentIdentity) {
        window.location.reload();
      }
    } catch {
      // Malformed persisted value — nothing safe to reconcile against, leave this tab as-is.
    }
  });
}
