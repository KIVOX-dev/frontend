import type { ReactNode } from "react";
import { ChartLineUp, Trophy, MagnifyingGlass, ChartBar, ClipboardText, UsersThree } from "@phosphor-icons/react";
import type { AuthSeason } from "@/components/layout/AuthMountains";

export type AudienceKey = "learner" | "hr" | "institutional";

export type PhotoBadge = {
  icon: typeof ChartLineUp;
  label: string;
  caption: string;
};

export type AudienceConfig = {
  key: AudienceKey;
  /** Real route this audience's marketing page lives at. */
  path: string;
  /** Label shown in the black top audience bar. */
  tabLabel: string;
  /** Suffix appended to the wordmark in the nav, e.g. "TalentSnaps for HR". */
  navSuffix: string | null;
  /** Nav's primary CTA button. */
  navCtaLabel: string;
  headline: ReactNode;
  description: string;
  bullets: string[];
  ctaLabel: string;
  /** Real app route this audience logs into / explores. */
  href: string;
  photo: { src: string; alt: string; badges: [PhotoBadge, PhotoBadge] };
  /** When set, the hero's photo panel renders this mountain scene instead
      of `photo` — ties the audience page into the same illustrated brand
      system as the login screens and footer, rather than a stock photo. */
  heroSeason?: AuthSeason;
};

// Single source of truth for the 3 audience-specific marketing pages
// (/, /for-hr, /for-institutions) — mirrors how coursera.org's top bar
// navigates to genuinely separate pages (coursera.org, /business, /campus),
// each with its own nav wordmark and CTA, rather than one page swapping
// content via client state.
export const AUDIENCES: Record<AudienceKey, AudienceConfig> = {
  learner: {
    key: "learner",
    path: "/",
    tabLabel: "For Institutions",
    navSuffix: null,
    navCtaLabel: "Request Demo",
    headline: (
      <>
        Practice smarter. <span className="text-primary">Get placed faster.</span>
      </>
    ),
    description:
      "AI-powered aptitude practice, mock interviews, and a resume builder — plus a national leaderboard so you always know exactly where you stand.",
    bullets: [
      "AI aptitude practice tests",
      "AI mock interviews & resume builder",
      "Apply directly to open job listings",
    ],
    ctaLabel: "Explore Learner Platform",
    href: "/learner",
    photo: {
      src: "/images/audience/learner.jpg",
      alt: "Three students laughing together over laptops",
      badges: [
        { icon: ChartLineUp, label: "AI Aptitude Practice", caption: "Instant scoring" },
        { icon: Trophy, label: "National Leaderboard", caption: "Live ranking" },
      ],
    },
  },
  hr: {
    key: "hr",
    path: "/for-hr",
    tabLabel: "For HR Teams",
    navSuffix: "for HR",
    navCtaLabel: "Contact Sales",
    headline: (
      <>
        Hire top campus talent <span className="text-primary">without the guesswork.</span>
      </>
    ),
    description:
      "Post job vacancies, review AI-scored applicant profiles, and hire from a global talent leaderboard — no separate ATS needed.",
    bullets: [
      "Post job vacancies in minutes",
      "AI-scored applicant review",
      "Global talent leaderboard access",
    ],
    ctaLabel: "Explore HR Platform",
    href: "/hr",
    heroSeason: "monsoon",
    photo: {
      src: "/images/audience/hr.jpg",
      alt: "A happy, diverse team of company staff celebrating together in an office",
      badges: [
        { icon: MagnifyingGlass, label: "AI-Scored Review", caption: "Automated" },
        { icon: ChartBar, label: "Global Leaderboard", caption: "Live" },
      ],
    },
  },
  institutional: {
    key: "institutional",
    path: "/for-institutions",
    tabLabel: "For Learners",
    navSuffix: "for Institutions",
    navCtaLabel: "Contact Us",
    headline: (
      <>
        Run your entire institution <span className="text-primary">from one system.</span>
      </>
    ),
    description:
      "Run placement drives together with HR, create and assign assessments, and oversee every department — all from one connected platform.",
    bullets: [
      "Placement drives run with HR",
      "Assessment creation & assignment",
      "Department-wide analytics",
    ],
    ctaLabel: "Explore Institution Platform",
    href: "/institutional",
    photo: {
      src: "/images/audience/institutional.jpg",
      alt: "A college administrator in her office",
      badges: [
        { icon: ClipboardText, label: "Assessment Suite", caption: "Built-in" },
        { icon: UsersThree, label: "Department Analytics", caption: "Real-time" },
      ],
    },
  },
};

export const AUDIENCE_ORDER: AudienceKey[] = ["learner", "hr", "institutional"];
