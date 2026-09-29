// Flat-illustration scene for AuthSplitLayout's left panel — a solid brand
// color, a floating "dashboard" card mockup, and a role-specific badge icon.
// Replaces the old procedural mountain scene: instead of one shape recolored
// per screen (AuthMountains' seasons), every portal gets its own color,
// stat copy, and icon, so each login genuinely reads as a different product
// surface rather than the same background in a different hue.
import React from "react";
import { Logo } from "@/components/shared/Logo";

export type PortalKey =
  | "institutionalHub"
  | "student"
  | "faculty"
  | "collegeAdmin"
  | "superadmin"
  | "hr"
  | "learner"
  | "general";

type Chip = { label: string; value: string };
type BadgeIconName = "compass" | "cap" | "chalkboard" | "building" | "shield" | "briefcase" | "rocket" | "mail";

export type PortalConfig = {
  bg: string;
  blobA: string;
  blobB: string;
  /** Headline/eyebrow/wordmark color — chosen per theme for contrast against `bg`. */
  text: string;
  textMuted: string;
  cardBg: string;
  cardInk: string;
  cardMuted: string;
  /** Chart bars + badge fill. */
  accent: string;
  /** Badge icon stroke color — needs its own field since it sits on `accent`, not `bg`. */
  badgeFg: string;
  badgeIcon: BadgeIconName;
  eyebrow: string;
  /** May contain \n for a manual line break (rendered via white-space: pre-line). */
  headline: string;
  sub: string;
  chips: [Chip, Chip, Chip];
  /** 6 bar heights, 0..1. */
  bars: number[];
};

export const PORTAL_THEME: Record<PortalKey, PortalConfig> = {
  institutionalHub: {
    bg: "#2B5CF6",
    blobA: "#1B44D1",
    blobB: "#6E90FF",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.8)",
    cardBg: "#FFFFFF",
    cardInk: "#12172B",
    cardMuted: "#7C8399",
    accent: "#2B5CF6",
    badgeFg: "#FFFFFF",
    badgeIcon: "compass",
    eyebrow: "INSTITUTIONAL PORTAL",
    headline: "One login,\nthree ways in.",
    sub: "Admins, faculty, and students — pick a role and get to work.",
    chips: [
      { label: "Portals", value: "3" },
      { label: "Colleges", value: "40+" },
      { label: "Users", value: "12k" },
    ],
    bars: [0.4, 0.7, 0.5, 0.9, 0.6, 0.8],
  },
  student: {
    bg: "#FF7A45",
    blobA: "#E4601F",
    blobB: "#FFB088",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.82)",
    cardBg: "#FFFFFF",
    cardInk: "#2B1608",
    cardMuted: "#9C8574",
    accent: "#FF7A45",
    badgeFg: "#FFFFFF",
    badgeIcon: "cap",
    eyebrow: "STUDENT PORTAL",
    headline: "Practice today,\nplace tomorrow.",
    sub: "Aptitude tests, mock interviews, and a resume that gets noticed.",
    chips: [
      { label: "Score", value: "92%" },
      { label: "Tests", value: "24" },
      { label: "Rank", value: "#12" },
    ],
    bars: [0.5, 0.35, 0.8, 0.6, 0.95, 0.7],
  },
  faculty: {
    bg: "#0FA574",
    blobA: "#0B7F5A",
    blobB: "#5FE0B6",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.8)",
    cardBg: "#FFFFFF",
    cardInk: "#0B2A20",
    cardMuted: "#7C9C90",
    accent: "#0FA574",
    badgeFg: "#FFFFFF",
    badgeIcon: "chalkboard",
    eyebrow: "FACULTY PORTAL",
    headline: "Guide every student\nto their best score.",
    sub: "Assign tests, track progress, and mentor with real data.",
    chips: [
      { label: "Students", value: "340" },
      { label: "Avg score", value: "78%" },
      { label: "Pending", value: "5" },
    ],
    bars: [0.6, 0.8, 0.4, 0.7, 0.5, 0.9],
  },
  collegeAdmin: {
    bg: "#7657FC",
    blobA: "#5539D6",
    blobB: "#B7A6FF",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.8)",
    cardBg: "#FFFFFF",
    cardInk: "#1C1533",
    cardMuted: "#8A81A8",
    accent: "#7657FC",
    badgeFg: "#FFFFFF",
    badgeIcon: "building",
    eyebrow: "INSTITUTION ADMIN",
    headline: "Run your institution's\nplacement drive.",
    sub: "Approve faculty, monitor students — one dashboard for it all.",
    chips: [
      { label: "Placements", value: "210" },
      { label: "Drives", value: "12" },
      { label: "Approvals", value: "3" },
    ],
    bars: [0.7, 0.5, 0.85, 0.6, 0.4, 0.75],
  },
  superadmin: {
    bg: "#12141C",
    blobA: "#1C2030",
    blobB: "#232A46",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.65)",
    cardBg: "#1A1D2B",
    cardInk: "#F4F6FF",
    cardMuted: "#7C86A8",
    accent: "#4CE0D2",
    badgeFg: "#0B0D14",
    badgeIcon: "shield",
    eyebrow: "SUPER ADMIN",
    headline: "Authorized personnel\nonly.",
    sub: "Full platform control — every action is logged.",
    chips: [
      { label: "Uptime", value: "99.9%" },
      { label: "Institutions", value: "128" },
      { label: "Flags", value: "2" },
    ],
    bars: [0.9, 0.6, 0.7, 0.5, 0.8, 0.65],
  },
  hr: {
    bg: "#F23F82",
    blobA: "#CC2568",
    blobB: "#FF94BB",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.82)",
    cardBg: "#FFFFFF",
    cardInk: "#33081C",
    cardMuted: "#A87890",
    accent: "#F23F82",
    badgeFg: "#FFFFFF",
    badgeIcon: "briefcase",
    eyebrow: "HR / RECRUITER",
    headline: "Source talent,\nnot resumes.",
    sub: "AI-ranked candidates and one-click interviews — hire faster.",
    chips: [
      { label: "Candidates", value: "1.2k" },
      { label: "Interviews", value: "48" },
      { label: "Hired", value: "16" },
    ],
    bars: [0.5, 0.7, 0.9, 0.6, 0.4, 0.8],
  },
  learner: {
    bg: "#F5B914",
    blobA: "#DFA200",
    blobB: "#FFD866",
    text: "#2A1D02",
    textMuted: "rgba(42,29,2,.68)",
    cardBg: "#FFFFFF",
    cardInk: "#2A1D02",
    cardMuted: "#9C8A55",
    accent: "#F5B914",
    badgeFg: "#2A1D02",
    badgeIcon: "rocket",
    eyebrow: "LEARNER PORTAL",
    headline: "Your placement journey\nstarts free.",
    sub: "Practice tests, mock interviews, and a resume that stands out.",
    chips: [
      { label: "Streak", value: "14d" },
      { label: "Skills", value: "9" },
      { label: "XP", value: "2.4k" },
    ],
    bars: [0.4, 0.6, 0.5, 0.8, 0.65, 0.95],
  },
  general: {
    bg: "#5B6EE8",
    blobA: "#3E52C9",
    blobB: "#9AA8FF",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,.8)",
    cardBg: "#FFFFFF",
    cardInk: "#181A33",
    cardMuted: "#8188B0",
    accent: "#5B6EE8",
    badgeFg: "#FFFFFF",
    badgeIcon: "mail",
    eyebrow: "ACCOUNT SECURITY",
    headline: "Keep your account\nsecure.",
    sub: "Reset links expire in minutes and never leave this device.",
    chips: [
      { label: "Encrypted", value: "Yes" },
      { label: "Expires", value: "15m" },
      { label: "Sessions", value: "Reset" },
    ],
    bars: [0.5, 0.55, 0.6, 0.5, 0.65, 0.55],
  },
};

const ICON_COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 20,
  height: 20,
};

function BadgeIcon({ icon }: { icon: BadgeIconName }) {
  switch (icon) {
    case "compass":
      return (
        <svg {...ICON_COMMON}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8" />
        </svg>
      );
    case "cap":
      return (
        <svg {...ICON_COMMON}>
          <path d="M22 10L12 5 2 10l10 5 10-5z" />
          <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
        </svg>
      );
    case "chalkboard":
      return (
        <svg {...ICON_COMMON}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "building":
      return (
        <svg {...ICON_COMMON}>
          <rect x="4" y="2" width="16" height="20" rx="1.5" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
        </svg>
      );
    case "shield":
      return (
        <svg {...ICON_COMMON}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...ICON_COMMON}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...ICON_COMMON}>
          <path d="M12 2c2.2 2.1 4 6.1 4 10 0 2-1 4-1 4H9s-1-2-1-4c0-3.9 1.8-7.9 4-10z" />
          <circle cx="12" cy="9" r="1.4" />
          <path d="M9 16l-2 4M15 16l2 4" />
        </svg>
      );
    case "mail":
      return (
        <svg {...ICON_COMMON}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6.2 12 13 2 6.2" />
        </svg>
      );
  }
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c.7 4.6 2.9 9 6.4 11.6C15 14.2 12.8 18.6 12 24c-.8-5.4-3-9.8-6.4-12.4C9 9 11.2 4.6 12 0z" />
    </svg>
  );
}

// Fixed positions + fixed timing (not Math.random()) so server and client
// render identical markup — same reasoning as AuthMountains' old star field.
const SPARKLES = [
  { x: "12%", y: "16%", size: 11, delay: 0 },
  { x: "84%", y: "28%", size: 8, delay: 0.6 },
  { x: "18%", y: "80%", size: 9, delay: 1.1 },
  { x: "88%", y: "70%", size: 7, delay: 0.3 },
];

export function PortalScene({ portal }: { portal: PortalKey }) {
  const t = PORTAL_THEME[portal];
  return (
    <>
      <div className="ps-blob ps-blob-a" style={{ background: t.blobA }} aria-hidden="true" />
      <div className="ps-blob ps-blob-b" style={{ background: t.blobB }} aria-hidden="true" />

      <div className="ps-topbar">
        <Logo variant="mark" height={30} />
        <span style={{ color: t.text }}>TalentSnaps</span>
      </div>

      <div className="lp-body">
        <div className="ps-stage">
          <div className="ps-card" style={{ background: t.cardBg, color: t.cardInk }}>
            <div className="ps-card-top">
              <span className="ps-dot" style={{ background: "#FF6159" }} />
              <span className="ps-dot" style={{ background: "#FFC02E" }} />
              <span className="ps-dot" style={{ background: "#28C93F" }} />
              <span className="ps-card-line" />
            </div>
            <div className="ps-chips">
              {t.chips.map((c) => (
                <div className="ps-chip" key={c.label}>
                  <span className="ps-chip-val">{c.value}</span>
                  <span className="ps-chip-lbl" style={{ color: t.cardMuted }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="ps-chart">
              {t.bars.map((h, i) => (
                <span
                  key={i}
                  className="ps-bar"
                  style={{ height: `${h * 100}%`, background: t.accent, opacity: 0.35 + h * 0.65 }}
                />
              ))}
            </div>
          </div>

          <div className="ps-badge" style={{ background: t.accent, color: t.badgeFg }}>
            <BadgeIcon icon={t.badgeIcon} />
          </div>

          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="ps-sparkle"
              style={{ left: s.x, top: s.y, color: t.text, animationDelay: `${s.delay}s` }}
            >
              <Sparkle size={s.size} />
            </span>
          ))}
        </div>

        <div className="ps-copy">
          <span className="ps-eyebrow" style={{ color: t.text, borderColor: t.text }}>
            {t.eyebrow}
          </span>
          <h2 style={{ color: t.text }}>{t.headline}</h2>
          <p style={{ color: t.textMuted }}>{t.sub}</p>
        </div>
      </div>
    </>
  );
}
