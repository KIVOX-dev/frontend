"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { api } from "@/lib/api";
import { useUiStore } from "@/stores/uiStore";

type Notification = {
  id: string;
  title: string;
  message?: string | null;
  type?: string | null;
  is_read: boolean;
  created_at?: string;
};

interface NotificationBellProps {
  /** Admin shells also surface their pending-approvals count here; shown as its own row that jumps to the approvals screen. */
  pendingApprovals?: number;
}

const POLL_MS = 60_000;

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * The top-bar bell. It used to be an inert icon in every shell, so anything
 * the backend sent a user (offer-letter reminders, for one) was created but
 * never seen. Lists the caller's own notifications, marks them read, and
 * refreshes every minute while the tab is visible.
 */
export function NotificationBell({ pendingApprovals = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveScreen } = useUiStore();

  const load = useCallback(async () => {
    try {
      const res = await api.get<Notification[]>("/notifications", { params: { limit: 20 } });
      setItems(res.data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    load();
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, load]);

  const unread = items.filter((n) => !n.is_read).length;
  const badge = unread + pendingApprovals;

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n)));
    // Optimistic: a failed PATCH just means it shows as unread again on the next refresh.
    await Promise.allSettled(ids.map((id) => api.patch(`/notifications/${id}/read`)));
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="ib"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={badge > 0 ? `Notifications, ${badge} unread` : "Notifications"}
        style={{ position: "relative" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {badge > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#dc2626",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            maxWidth: "calc(100vw - 24px)",
            background: "var(--surface, #fff)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r2, 10px)",
            boxShadow: "0 8px 24px rgba(0,0,0,.14)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)" }}>Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead(items.filter((n) => !n.is_read).map((n) => n.id))}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {pendingApprovals > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveScreen("security");
                setOpen(false);
              }}
              style={{ ...rowStyle, background: "var(--accent-l)", fontWeight: 600 }}
            >
              {pendingApprovals} approval{pendingApprovals === 1 ? "" : "s"} waiting for review →
            </button>
          )}

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {failed && items.length === 0 ? (
              <div style={emptyStyle}>Couldn&apos;t load notifications.</div>
            ) : items.length === 0 ? (
              <div style={emptyStyle}>You&apos;re all caught up.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.is_read && markRead([n.id])}
                  style={{ ...rowStyle, background: n.is_read ? "none" : "var(--accent-l)", cursor: n.is_read ? "default" : "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontWeight: n.is_read ? 500 : 700, fontSize: "13px", color: "var(--text)" }}>{n.title}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {n.message && <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{n.message}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  border: "none",
  borderBottom: "1px solid var(--border)",
  fontSize: "13px",
  color: "var(--text)",
};

const emptyStyle: CSSProperties = { padding: "24px 14px", textAlign: "center", fontSize: "13px", color: "var(--muted)" };
