"use client";

import React from "react";
import { Gem, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { planStatus, formatPlanDate } from "@/lib/plan";

/**
 * Plan row at the bottom of the sidebar. Shown only for accounts that can buy
 * a plan (independent learners and HR/recruiters); institutional accounts get nothing.
 * Deliberately quiet: white surface, hairline border, one small accent.
 */
export function SidebarPlanStrip({ onClick }: { onClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { eligible, isPro, expiresAt } = planStatus(user);
  if (!eligible) return null;

  const title = isPro ? "Pro" : "Free";
  const detail = isPro
    ? expiresAt ? `Valid until ${formatPlanDate(expiresAt)}` : "Active"
    : "Upgrade to unlock more";

  return (
    <button
      type="button"
      className="plan-strip"
      onClick={onClick}
      aria-label={`${title} plan. ${detail}. Open subscription`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        textAlign: "left",
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "10px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "30px",
          height: "30px",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "8px",
          background: isPro ? "#0b1f4d" : "#f1f5f9",
          color: isPro ? "#fff" : "#64748b",
        }}
      >
        <Gem size={15} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>
          {title} plan
        </span>
        <span style={{ display: "block", fontSize: "11.5px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.2 }}>
          {detail}
        </span>
      </span>
      <ChevronRight size={15} aria-hidden="true" style={{ color: "var(--muted)", flexShrink: 0 }} />
    </button>
  );
}
