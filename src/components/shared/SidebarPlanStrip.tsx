"use client";

import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { planStatus, formatPlanDate } from "@/lib/plan";

/**
 * Plan card at the bottom of the sidebar. Shown only for accounts that can buy
 * a plan (independent learners and HR/recruiters); institutional accounts get nothing.
 */
export function SidebarPlanStrip({ onClick }: { onClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { eligible, isPro, expiresAt } = planStatus(user);
  if (!eligible) return null;

  return (
    <button
      type="button"
      className="plan-strip"
      onClick={onClick}
      style={{ display: "block", width: "100%", textAlign: "left" }}
    >
      <div className="plan-name">{isPro ? "Pro Plan" : "Free Plan"}</div>
      <div className="plan-sub">
        {isPro
          ? expiresAt
            ? `Active until ${formatPlanDate(expiresAt)}`
            : "All features unlocked"
          : "Upgrade for more features"}
      </div>
      <div className="plan-bar-w">
        <div className="plan-bar-f" style={{ width: isPro ? "100%" : "20%", background: "var(--accent)" }}></div>
      </div>
    </button>
  );
}
