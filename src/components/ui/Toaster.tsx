"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { useToastStore, toast, type ToastItem, type ToastVariant } from "@/lib/toast";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 10.5 8 14.5 16 5.5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="14" y2="14" />
      <line x1="14" y1="6" x2="6" y2="14" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2 18 17H2Z" strokeLinejoin="round" />
      <line x1="10" y1="8" x2="10" y2="11.5" />
      <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.25" />
      <line x1="10" y1="9" x2="10" y2="14" />
      <circle cx="10" cy="6.25" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  ),
  loading: (
    <svg className="ut-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 2.75a7.25 7.25 0 1 0 7.25 7.25" />
    </svg>
  ),
};

function ToastRow({ item }: { item: ToastItem }) {
  return (
    <RadixToast.Root
      className={`ut-root ut-${item.variant}`}
      duration={item.duration ?? Infinity}
      onOpenChange={(open) => {
        if (!open) toast.dismiss(item.id);
      }}
    >
      <div className="ut-icon" aria-hidden="true">
        {ICONS[item.variant]}
      </div>
      <div className="ut-text">
        <RadixToast.Title className="ut-title">{item.title}</RadixToast.Title>
        {item.description && <RadixToast.Description className="ut-desc">{item.description}</RadixToast.Description>}
      </div>
      {item.variant !== "loading" && (
        <RadixToast.Close className="ut-close" aria-label="Dismiss">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="5" y1="5" x2="15" y2="15" />
            <line x1="15" y1="5" x2="5" y2="15" />
          </svg>
        </RadixToast.Close>
      )}
    </RadixToast.Root>
  );
}

/** Mounted once at the root layout. Renders every active toast from the
 * shared store (see lib/toast.ts) — components never render their own
 * toasts, they just call toast.success/error/etc. from anywhere. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <RadixToast.Provider swipeDirection="right" duration={4000}>
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
      <RadixToast.Viewport className="ut-viewport" />
      <style jsx global>{`
        .ut-viewport {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 380px;
          max-width: calc(100vw - 32px);
          list-style: none;
          margin: 0;
          padding: 0;
          z-index: 2147483000;
          outline: none;
        }
        .ut-root {
          --ut-accent: #2daa1f;
          --ut-bg: #ffffff;
          --ut-text: #111827;
          --ut-muted: #6b7280;
          --ut-border: #e5e7eb;
          --ut-shadow: 0 2px 8px rgba(16, 24, 40, 0.06), 0 12px 32px -8px rgba(16, 24, 40, 0.16);
          display: grid;
          grid-template-columns: 20px 1fr auto;
          gap: 10px;
          align-items: start;
          background: var(--ut-bg);
          color: var(--ut-text);
          border: 1px solid var(--ut-border);
          border-radius: 12px;
          box-shadow: var(--ut-shadow);
          padding: 13px 14px;
          font-family: inherit;
        }
        @media (prefers-color-scheme: dark) {
          .ut-root {
            --ut-bg: #1a1d23;
            --ut-text: #f0f2f4;
            --ut-muted: #9aa3ad;
            --ut-border: #2c313a;
            --ut-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 12px 32px -8px rgba(0, 0, 0, 0.5);
          }
        }
        .ut-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ut-icon svg { width: 18px; height: 18px; }
        .ut-success .ut-icon { color: #2daa1f; }
        .ut-error .ut-icon { color: #ef4444; }
        .ut-warning .ut-icon { color: #f59e0b; }
        .ut-info .ut-icon, .ut-loading .ut-icon { color: var(--ut-accent); }
        .ut-text { min-width: 0; }
        .ut-title { font-size: 13.5px; font-weight: 650; line-height: 1.35; margin: 0; }
        .ut-desc { font-size: 12.5px; color: var(--ut-muted); margin: 3px 0 0; line-height: 1.4; }
        .ut-close {
          background: none;
          border: none;
          padding: 2px;
          margin: -2px -2px 0 0;
          color: var(--ut-muted);
          cursor: pointer;
          border-radius: 6px;
          line-height: 0;
        }
        .ut-close:hover { background: var(--ut-border); color: var(--ut-text); }
        .ut-close svg { width: 13px; height: 13px; }
        .ut-close:focus-visible, .ut-root:focus-visible {
          outline: 2px solid var(--ut-accent);
          outline-offset: 2px;
        }
        .ut-spin { animation: ut-spin 0.8s linear infinite; }
        @keyframes ut-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ut-spin { animation-duration: 2s; }
        }

        .ut-root[data-state="open"] { animation: ut-in 200ms var(--ut-ease, cubic-bezier(0.16, 1, 0.3, 1)); }
        .ut-root[data-state="closed"] { animation: ut-out 160ms ease-in forwards; }
        .ut-root[data-swipe="move"] { transform: translateX(var(--radix-toast-swipe-move-x)); }
        .ut-root[data-swipe="end"] { animation: ut-swipe-out 120ms ease-out forwards; }
        @keyframes ut-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ut-out {
          from { opacity: 1; height: auto; }
          to { opacity: 0; height: 0; margin: 0; padding-top: 0; padding-bottom: 0; }
        }
        @keyframes ut-swipe-out {
          from { transform: translateX(var(--radix-toast-swipe-end-x)); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ut-root[data-state="open"], .ut-root[data-state="closed"] { animation: none; }
        }

        @media (max-width: 480px) {
          .ut-viewport { left: 16px; right: 16px; width: auto; bottom: 16px; }
        }
      `}</style>
    </RadixToast.Provider>
  );
}
