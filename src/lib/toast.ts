import { create } from "zustand";
import { extractErrorMessage } from "./errors";

// Re-exported for existing `import { extractErrorMessage } from "@/lib/toast"`
// call sites — the implementation itself lives in lib/errors.ts (the
// single, centralized place error-shape parsing happens; see that file's
// header comment). Import from lib/errors directly in new code.
export { extractErrorMessage };

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** ms until auto-dismiss. `loading` toasts default to persistent (undefined). */
  duration?: number;
};

const DEFAULT_DURATION: Record<ToastVariant, number | undefined> = {
  success: 4000,
  info: 4000,
  warning: 5500,
  error: 6500,
  loading: undefined,
};

type ToastState = {
  toasts: ToastItem[];
  add: (t: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  update: (id: string, patch: Partial<Omit<ToastItem, "id">>) => void;
};

// Zustand rather than React Context — matches this app's existing state
// pattern (authStore, uiStore) and, unlike Context, lets `toast.error(...)`
// be called from plain async functions/catch blocks with no hook and no
// component in scope, which is where almost every alert() call actually was.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    const duration = t.duration ?? DEFAULT_DURATION[t.variant];
    set((s) => ({ toasts: [...s.toasts, { id, duration, ...t }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  update: (id, patch) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch, duration: patch.duration ?? DEFAULT_DURATION[patch.variant ?? t.variant] } : t)),
    })),
}));

function show(variant: ToastVariant, title: string, description?: string) {
  return useToastStore.getState().add({ variant, title, description });
}

export const toast = {
  success: (title: string, description?: string) => show("success", title, description),
  error: (titleOrError: string | unknown, description?: string) => {
    if (typeof titleOrError === "string") return show("error", titleOrError, description);
    return show("error", extractErrorMessage(titleOrError, description ?? "Something went wrong"));
  },
  warning: (title: string, description?: string) => show("warning", title, description),
  info: (title: string, description?: string) => show("info", title, description),
  /** Returns an id — pass it to toast.resolve/toast.dismiss once the async work finishes. */
  loading: (title: string, description?: string) => show("loading", title, description),
  /** Flip a loading toast into success/error in place, rather than stacking a second toast. */
  resolve: (id: string, variant: "success" | "error", title: string, description?: string) =>
    useToastStore.getState().update(id, { variant, title, description }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
