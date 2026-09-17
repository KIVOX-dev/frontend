"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

interface ProfileMenuProps {
  /** Content of the .uav avatar circle — a letter (LearnerShell/CollegeAdminShell) or short text (HrShell's "HR"). */
  avatar: ReactNode;
  avatarStyle?: CSSProperties;
  name: string;
  roleLabel: ReactNode;
  /** HrShell has no "settings" screen id — omit the menu item rather than link to a screen that doesn't exist. */
  showSettings?: boolean;
}

/**
 * The previously-inert .uc profile chip, now with an actual dropdown
 * (Profile / Settings / Log out) — shared across every role's shell so this
 * only needs building once. "My Activity" routes to the shared
 * MyActivity screen via useUiStore's existing setActiveScreen mechanism,
 * the same client-side screen-switcher every other nav item already uses.
 */
export function ProfileMenu({ avatar, avatarStyle, name, roleLabel, showSettings = true }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { setActiveScreen } = useUiStore();

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="uc"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", color: "inherit" }}
      >
        <div className="uav" style={avatarStyle}>{avatar}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span className="un">{name}</span>
          <span className="ur">{roleLabel}</span>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: "220px",
            background: "var(--surface, #fff)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r2, 10px)",
            boxShadow: "0 8px 24px rgba(0,0,0,.14)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)" }}>{name}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setActiveScreen("my-activity");
              setOpen(false);
            }}
            style={menuItemStyle}
          >
            My Activity
          </button>
          {showSettings && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActiveScreen("profile-info");
                setOpen(false);
              }}
              style={menuItemStyle}
            >
              Profile
            </button>
          )}
          {showSettings && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActiveScreen("settings");
                setOpen(false);
              }}
              style={menuItemStyle}
            >
              Settings
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            style={{ ...menuItemStyle, color: "var(--red, #dc2626)" }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  color: "var(--text)",
};
