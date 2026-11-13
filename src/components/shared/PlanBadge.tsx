"use client";

import { Gem, Sparkles } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { formatPlanDate } from "@/lib/plan";

/* Glass chip showing the account's plan. Inline styles so the frosted look doesn't depend on
   which Tailwind gradient utilities this build ships. Basic is a button that opens the plan screen. */

const GLASS_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "38px",
  padding: "0 16px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  backdropFilter: "blur(14px) saturate(160%)",
  transition: "transform .15s ease, box-shadow .15s ease",
};

const BASIC: React.CSSProperties = {
  ...GLASS_BASE,
  color: "#475569",
  background: "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(203,213,225,0.45))",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 6px 18px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(148,163,184,0.25)",
};

const PRO: React.CSSProperties = {
  ...GLASS_BASE,
  color: "#1d4ed8",
  background: "linear-gradient(135deg, rgba(59,130,246,0.30), rgba(139,92,246,0.24))",
  border: "1px solid rgba(147,197,253,0.75)",
  boxShadow: "0 8px 22px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(99,102,241,0.25)",
};

export function PlanBadge({ isPro, expiresAt, role }: { isPro: boolean; expiresAt: Date | null; role?: string }) {
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);

  if (isPro) {
    return (
      <span style={PRO} title={expiresAt ? `Pro until ${formatPlanDate(expiresAt)}` : "Pro plan"}>
        <Gem size={17} aria-hidden="true" />
        Pro
      </span>
    );
  }

  const target = role === "hr" || role === "recruiter" ? "hr-subs" : "subs";
  return (
    <button
      type="button"
      style={{ ...BASIC, cursor: "pointer" }}
      title="You're on the free plan. Click to see Pro."
      onClick={() => setActiveScreen(target)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
    >
      <Sparkles size={16} aria-hidden="true" />
      Basic
    </button>
  );
}
