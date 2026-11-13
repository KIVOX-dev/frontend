"use client";

import { Gem } from "lucide-react";
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

/** Sparkle with its own gradient + glow; only the icon is shaded, the label keeps its flat colour. */
function ShadedSparkle({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ flexShrink: 0, overflow: "visible", filter: "drop-shadow(0 1px 3px rgba(124,58,237,0.45))" }}>
      <defs>
        <linearGradient id="plan-sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <g fill="url(#plan-sparkle-grad)" stroke="url(#plan-sparkle-grad)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4M22 5h-4" fill="none" />
        <path d="M4 17v2M5 18H3" fill="none" />
      </g>
    </svg>
  );
}

/** The plain glass chip, no click action. Used on the plan cards and inside PlanBadge. */
export function PlanChip({ variant, title }: { variant: "basic" | "pro"; title?: string }) {
  if (variant === "pro") {
    return (
      <span style={PRO} title={title ?? "Pro plan"}>
        <Gem size={17} aria-hidden="true" />
        Pro
      </span>
    );
  }
  return (
    <span style={BASIC} title={title ?? "Free plan"}>
      <ShadedSparkle />
      Basic
    </span>
  );
}

export function PlanBadge({ isPro, expiresAt, role }: { isPro: boolean; expiresAt: Date | null; role?: string }) {
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);

  if (isPro) {
    return <PlanChip variant="pro" title={expiresAt ? `Pro until ${formatPlanDate(expiresAt)}` : "Pro plan"} />;
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
      <ShadedSparkle />
      Basic
    </button>
  );
}
