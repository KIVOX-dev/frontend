"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Briefcase, GraduationCap, Users, Buildings, Check, ArrowRight, MagnifyingGlass, ChartBar } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RevealHeading } from "./RevealHeading";
import type { AudienceKey } from "./audiences";

// The 3 HR-specific "tracks" — sourcing, screening, insights — shown
// instead of the generic 4-role grid below when this section renders on
// the HR-specific landing page. Each maps to a real part of HRShowcase's
// dashboard (Post a Vacancy / Applicants / Talent Board & Candidate
// Analytics), so "explore" always lands somewhere real, not a stub page.
const hrTracks = [
  {
    id: "sourcing",
    icon: Briefcase,
    eyebrow: "Sourcing",
    title: "Talent Discovery Track",
    description: "Post vacancies in minutes and reach every student on the platform actively practicing for placement.",
    cta: "Post a vacancy",
    href: "/hr",
  },
  {
    id: "screening",
    icon: MagnifyingGlass,
    eyebrow: "Screening",
    title: "AI Screening Track",
    description: "Every applicant arrives pre-scored by AI against the role, so shortlisting takes minutes, not days.",
    cta: "See how scoring works",
    href: "/hr",
  },
  {
    id: "insights",
    icon: ChartBar,
    eyebrow: "Insights",
    title: "Hiring Analytics Track",
    description: "A global talent leaderboard and hiring analytics dashboard, so you know exactly who to reach out to.",
    cta: "Explore analytics",
    href: "/hr",
  },
];

const roles = [
  {
    id: "hr",
    icon: Briefcase,
    role: "HR Team",
    title: "Campus Recruiting",
    description: "Post vacancies, review AI-scored applicants, and hire top campus talent.",
    benefits: [
      "Post job vacancies",
      "AI-scored applicant review",
      "Global talent leaderboard",
      "Candidate shortlisting",
      "Hiring analytics",
    ],
    cta: "Explore HR Solution",
    href: "/hr",
    visual: (
      <div className="space-y-1.5">
        {[
          { name: "Full Stack Developer", tag: "24 applicants" },
          { name: "Data Analyst", tag: "12 applicants" },
          { name: "SDE Intern", tag: "31 applicants" },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5">
            <span className="size-6 rounded-full bg-primary/15 shrink-0" />
            <span className="text-caption font-semibold text-ink flex-1 truncate">{row.name}</span>
            <span className="text-[10px] font-semibold text-ink-faint">{row.tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "student",
    icon: GraduationCap,
    role: "Student",
    title: "Student Experience",
    description: "AI-powered aptitude practice, mock interviews, and a resume builder to prepare for placements.",
    benefits: [
      "AI aptitude practice tests",
      "AI mock interviews",
      "AI resume builder",
      "Performance analytics",
      "National leaderboard ranking",
    ],
    cta: "Explore Student Solution",
    href: "/learner",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Tests Completed</span>
          <span className="text-[10px] font-semibold text-primary">24</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Avg Accuracy</span>
          <span className="text-[10px] font-semibold text-ink-faint">78%</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">National Rank</span>
          <span className="text-[10px] font-semibold text-ink-faint">#142</span>
        </div>
      </div>
    ),
  },
  {
    id: "faculty",
    icon: Users,
    role: "Faculty",
    title: "Faculty Tools",
    description: "Onboard students and track their aptitude test performance.",
    benefits: [
      "Add students individually",
      "Bulk student upload (CSV)",
      "Student performance tracking",
      "Direct messaging",
      "Secure account management",
    ],
    cta: "Explore Faculty Solution",
    href: "/faculty",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Rahul Verma</span>
          <span className="text-[10px] font-semibold text-primary">Approved</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Sneha Iyer</span>
          <span className="text-[10px] font-semibold text-primary">Approved</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Karan Mehta</span>
          <span className="text-[10px] font-semibold text-ink-faint">Pending</span>
        </div>
      </div>
    ),
  },
  {
    id: "admin",
    icon: Buildings,
    role: "College Admin",
    title: "Institution Management",
    description: "Run placement drives, manage assessments, and oversee every department's users.",
    benefits: [
      "Placement drive management",
      "Assessment creation & assignment",
      "User & department management",
      "Placement analytics",
      "Multi-department test assignment",
    ],
    cta: "Explore Admin Solution",
    href: "/institutional",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Active Drives</span>
          <span className="text-[10px] font-semibold text-primary">9</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Total Placements</span>
          <span className="text-[10px] font-semibold text-ink-faint">128</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Departments</span>
          <span className="text-[10px] font-semibold text-ink-faint">42 active</span>
        </div>
      </div>
    ),
  },
];

export default function SolutionsByRole({ audience }: { audience: AudienceKey }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // HR gets its own focused "tracks" pitch instead of the generic 4-role
  // grid — the other roles' workspaces aren't relevant to someone visiting
  // the HR-specific page to evaluate hiring, not the whole institution.
  if (audience === "hr") {
    return (
      <section ref={ref} id="solutions" className="bg-white ui-section border-t border-line">
        <div className="ui-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mb-14"
          >
            <RevealHeading className="text-heading-l">
              Each track offers a focused, measurable path — powered by one connected platform.
            </RevealHeading>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {hrTracks.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="h-full flex flex-col">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mb-4">
                    <t.icon className="size-[18px]" />
                  </span>
                  <span className="text-caption font-bold uppercase tracking-wide text-ink-faint mb-2">
                    {t.eyebrow}
                  </span>
                  <h3 className="text-section-title mb-2">{t.title}</h3>
                  <p className="text-small mb-5 flex-1">{t.description}</p>
                  <Link
                    href={t.href}
                    className="group inline-flex items-center gap-1.5 text-small font-semibold text-primary"
                  >
                    {t.cta}
                    <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="solutions" className="bg-white ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Built for every role
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Solutions designed for every role in your institution.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            Whoever you are on campus, there&apos;s a workspace built around exactly what you need to do.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card interactive className="h-full flex flex-col">
                <div className="rounded-md border border-line bg-[var(--color-sidebar)] p-3 mb-5">
                  {r.visual}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <r.icon className="size-[18px]" />
                  </span>
                  <span className="text-caption font-bold uppercase tracking-wide">{r.role}</span>
                </div>

                <h3 className="text-section-title mb-2">{r.title}</h3>
                <p className="text-small mb-4">{r.description}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {r.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-small text-ink">
                      <Check className="size-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <Link href={r.href} className="w-full">
                  <Button variant="secondary" shape="pill" className="group w-full justify-center pr-2">
                    {r.cta}
                    <ButtonIconChip tone="dark" className="size-5">
                      <ArrowRight className="size-3" />
                    </ButtonIconChip>
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
