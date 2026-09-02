"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  MagnifyingGlass,
  ChartLineUp,
  Trophy,
  ClipboardText,
  Sparkle,
  Briefcase,
  UsersThree,
  ChartBar,
  Buildings,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { RevealHeading } from "./RevealHeading";
import type { AudienceKey } from "./audiences";

type Highlight = {
  icon: typeof MagnifyingGlass;
  eyebrow: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
};

const HIGHLIGHTS: Record<AudienceKey, Highlight[]> = {
  learner: [
    {
      icon: ChartLineUp,
      eyebrow: "SKILL PRACTICE",
      title: "Aptitude Skills Track",
      description: "Timed AI aptitude tests across quant, logical, and verbal reasoning — with instant, detailed scoring.",
      linkLabel: "Start practicing",
      href: "/learner",
    },
    {
      icon: Sparkle,
      eyebrow: "INTERVIEW READY",
      title: "Mock Interview & Resume Track",
      description: "AI mock interviews and a guided resume builder, so you walk into the real thing already rehearsed.",
      linkLabel: "Get interview-ready",
      href: "/learner",
    },
    {
      icon: Trophy,
      eyebrow: "JOB SEARCH",
      title: "Placement Track",
      description: "Apply directly to open job listings and track where you stand on the national leaderboard.",
      linkLabel: "Browse openings",
      href: "/learner",
    },
  ],
  hr: [
    {
      icon: Briefcase,
      eyebrow: "SOURCING",
      title: "Talent Discovery Track",
      description: "Post vacancies in minutes and reach every student on the platform actively practicing for placement.",
      linkLabel: "Post a vacancy",
      href: "/hr",
    },
    {
      icon: MagnifyingGlass,
      eyebrow: "SCREENING",
      title: "AI Screening Track",
      description: "Every applicant arrives pre-scored by AI against the role, so shortlisting takes minutes, not days.",
      linkLabel: "See how scoring works",
      href: "/hr",
    },
    {
      icon: ChartBar,
      eyebrow: "INSIGHTS",
      title: "Hiring Analytics Track",
      description: "A global talent leaderboard and hiring analytics dashboard, so you know exactly who to reach out to.",
      linkLabel: "Explore analytics",
      href: "/hr",
    },
  ],
  institutional: [
    {
      icon: Buildings,
      eyebrow: "PLACEMENTS",
      title: "Placement Operations Track",
      description: "Run placement drives jointly with HR teams — one pipeline from job posting to offer letter.",
      linkLabel: "Manage placement drives",
      href: "/institutional",
    },
    {
      icon: ClipboardText,
      eyebrow: "ASSESSMENTS",
      title: "Assessment Suite Track",
      description: "Create and assign assessments across departments, with results feeding straight into student records.",
      linkLabel: "Build an assessment",
      href: "/institutional",
    },
    {
      icon: UsersThree,
      eyebrow: "OVERSIGHT",
      title: "Department Analytics Track",
      description: "Department-wide analytics on student performance, faculty activity, and placement outcomes.",
      linkLabel: "View analytics",
      href: "/institutional",
    },
  ],
};

// Mirrors the 3-card "Skills Track" row Coursera shows on coursera.org/business
// (Data / IT / GenAI Skills Track) — same layout, translated to this
// audience's real features instead of course catalog content.
export default function AudienceHighlights({ audience }: { audience: AudienceKey }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const highlights = HIGHLIGHTS[audience];

  return (
    <section ref={ref} className="bg-[var(--color-sidebar)] ui-section border-t border-line">
      <div className="ui-container">
        <RevealHeading className="text-heading-l mb-10 max-w-2xl">
          Each track offers a focused, measurable path — powered by one connected platform.
        </RevealHeading>

        <div className="grid md:grid-cols-3 gap-5">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full flex flex-col">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5">
                  <h.icon className="size-5" weight="bold" />
                </span>
                <p className="text-caption font-bold uppercase tracking-wide text-ink-faint mb-2">{h.eyebrow}</p>
                <h3 className="text-section-title mb-2">{h.title}</h3>
                <p className="text-small mb-5 flex-1">{h.description}</p>
                <Link
                  href={h.href}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary w-fit"
                >
                  {h.linkLabel}
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
