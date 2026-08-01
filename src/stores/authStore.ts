import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const PERSIST_KEY = 'upscaler-ai-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Match exact localStorage keys used by the old HTML/JS frontend
        localStorage.setItem('upscaler_ai_token', token);
        localStorage.setItem('upscaler_ai_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('upscaler_ai_token');
        localStorage.removeItem('upscaler_ai_user');
        localStorage.removeItem('upscaler_ai_refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        })),
    }),
    {
      name: PERSIST_KEY, // persisted key in localStorage
    }
  )
);

// localStorage is shared across every tab of this origin, so logging into a
// DIFFERENT account in one tab silently rewrites the bearer/refresh tokens
// every other open tab is still using — a still-open tab keeps rendering its
// own (now-stale) account while its next request goes out with someone
// else's token, surfacing as a confusing 401/403 instead of a clear signal.
// The 'storage' event fires in every OTHER tab (never the one that made the
// change), so on a genuine account switch — not just this account's access
// token silently rotating on refresh — reload so the tab re-hydrates onto
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
