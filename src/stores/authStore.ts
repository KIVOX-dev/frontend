import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id?: string;
  id?: string | number;
  email: string;
  name: string;
  role: string;          // 'student' | 'faculty' | 'college_admin' | 'super_admin' | 'recruiter'
  college_id?: string;
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
      name: 'upscaler-ai-auth', // persisted key in localStorage
    }
  )
);
