"use client";

import { useModalA11y } from "@/hooks/useModalA11y";

/**
 * In-app replacement for window.confirm(): styled like the rest of the app,
 * focus-trapped, closes on Escape / backdrop click (both = cancel), and
 * usable on mobile where a native browser dialog looks out of place.
 *
 * Controlled: render it always and drive `open` from state.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { panelRef, dialogProps } = useModalA11y(open, onCancel, "confirm-dialog-title");
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
    >
      <div
        ref={panelRef}
        {...dialogProps}
        role="alertdialog"
        aria-describedby="confirm-dialog-message"
        className="card"
        style={{ width: "100%", maxWidth: "420px", padding: "24px", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}
      >
        <h3 id="confirm-dialog-title" style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{title}</h3>
        <div id="confirm-dialog-message" style={{ fontSize: "14px", lineHeight: 1.55, color: "var(--muted)", marginBottom: "22px" }}>{message}</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-o" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button
            type="button"
            className={danger ? "btn btn-red" : "btn btn-p"}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
