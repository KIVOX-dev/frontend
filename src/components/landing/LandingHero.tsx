"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, GraduationCap, Briefcase, Buildings } from "@phosphor-icons/react";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { MagneticButton } from "./MagneticButton";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

type AudienceKey = "learner" | "hr" | "institutional";

type Audience = {
  tabLabel: string;
  tabIcon: ComponentType<{ className?: string }>;
  headline: React.ReactNode;
  description: string;
  bullets: string[];
  ctaLabel: string;
  href: string;
  photo: { src: string; alt: string };
};

const AUDIENCES: Record<AudienceKey, Audience> = {
  learner: {
    tabLabel: "For Learners",
    tabIcon: GraduationCap,
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
    photo: { src: "/images/audience/learner.jpg", alt: "A student browsing books in a library" },
  },
  hr: {
    tabLabel: "For HR Teams",
    tabIcon: Briefcase,
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
    photo: { src: "/images/audience/hr.jpg", alt: "An HR professional handing a document to a candidate" },
  },
  institutional: {
    tabLabel: "For Institutions",
    tabIcon: Buildings,
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
    photo: { src: "/images/audience/institutional.jpg", alt: "A college administrator in her office" },
  },
};

const TAB_ORDER: AudienceKey[] = ["learner", "hr", "institutional"];

export default function LandingHero() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<AudienceKey>("learner");
  const audience = AUDIENCES[active];

  return (
    <section id="main-content" className="relative min-h-screen bg-white flex items-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: "var(--background-image-hero-mesh)" }}
      />

      <div className="relative z-10 ui-container w-full py-16 lg:py-20">
        {/* Audience switcher */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={entrance}
          className="inline-flex flex-wrap items-center gap-1 rounded-full border border-line bg-[var(--color-sidebar)] p-1 mb-10"
          role="tablist"
          aria-label="Choose your role"
        >
          {TAB_ORDER.map((key) => {
            const tab = AUDIENCES[key];
            const isActive = key === active;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(key)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isActive ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink"
                }`}
              >
                <tab.tabIcon className="size-4" />
                {tab.tabLabel}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={entrance}
            className="grid lg:grid-cols-[3fr_2fr] gap-14 xl:gap-20 items-center"
          >
            {/* Left: copy */}
            <div>
              <h1 className="text-heading-xl lg:text-[52px] mb-6">{audience.headline}</h1>

              <p className="text-body text-ink-muted mb-7 max-w-xl">{audience.description}</p>

              <ul className="flex flex-col gap-2.5 mb-9">
                {audience.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-body text-ink">
                    <Check className="size-4 text-primary shrink-0" weight="bold" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <MagneticButton strength={0.2}>
                  <Link href={audience.href}>
                    <Button size="lg" shape="pill" className="group pr-2">
                      {audience.ctaLabel}
                      <ButtonIconChip>
                        <ArrowRight className="size-3.5" />
                      </ButtonIconChip>
                    </Button>
                  </Link>
                </MagneticButton>
                <Link href={audience.href}>
                  <Button variant="secondary" size="lg" shape="pill">
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: real photo for the active audience */}
            <div className="relative hidden lg:block">
              <div className="rounded-[2rem] bg-ink/[0.04] ring-1 ring-ink/5 p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <Image
                    src={audience.photo.src}
                    alt={audience.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
