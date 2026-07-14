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
        localStorage.setItem('skillovate_token', token);
        localStorage.setItem('skillovate_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('skillovate_token');
        localStorage.removeItem('skillovate_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        })),
    }),
    {
      name: 'skillovate-auth', // persisted key in localStorage
    }
  )
);
