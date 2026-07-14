import axios from "axios";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000/api/v1`;
  return "http://localhost:8000/api/v1";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - uses 'skillovate_token' to match the old frontend
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("skillovate_token") || localStorage.getItem("sk_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import { useAuthStore } from "@/stores/authStore";

// Response interceptor - clears auth store on 401 (except for login requests)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isLogin = error.config?.url?.includes('/auth/login');
      if (!isLogin) {
        useAuthStore.getState().logout();
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);
