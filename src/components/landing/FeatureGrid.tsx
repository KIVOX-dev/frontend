"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Target, Mic, FileText, Briefcase, ClipboardList, BarChart3, MessageSquare } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";

const features = [
  {
    icon: Target,
    badge: "Practice",
    title: "AI Aptitude Practice",
    desc: "Adaptive Quantitative, Logical Reasoning, Data Interpretation, and Verbal tests, with streaks and a national leaderboard rank.",
  },
  {
    icon: Mic,
    badge: "Interviews",
    title: "AI Mock Interviews",
    desc: "Students rehearse real interview scenarios with AI-driven feedback before they ever face a recruiter.",
  },
  {
    icon: FileText,
    badge: "Resume",
    title: "AI Resume Builder",
    desc: "Parse, analyze, and auto-improve a resume, matched directly against a target job description.",
  },
  {
    icon: ClipboardList,
    badge: "Assessments",
    title: "Assessment Management",
    desc: "Create a test once, auto-draw questions from the bank, and assign it to whole departments and batches in one action.",
  },
  {
    icon: Briefcase,
    badge: "Recruiting",
    title: "Campus Recruiting",
    desc: "HR teams post vacancies and hire straight from an AI-scored applicant leaderboard — no separate ATS needed.",
  },
  {
    icon: BarChart3,
    badge: "Insights",
    title: "Analytics Dashboard",
    desc: "Live, role-aware dashboards that turn placement, assessment, and user data into decisions — no spreadsheets required.",
  },
  {
    icon: MessageSquare,
    badge: "Messaging",
    title: "Communication",
    desc: "Direct messaging keeps students, faculty, HR, and administrators aligned without leaving the platform.",
  },
];

export default function FeatureGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className="bg-[var(--color-bg-secondary)] ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Platform Features
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Everything an institution needs, built in.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            Every feature is purpose-built to connect the people who run your institution with the
            people it serves.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <TiltCard key={feat.title} maxTilt={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                className="group relative h-full rounded-lg border border-line bg-white p-7 shadow-card transition-shadow duration-150 hover:shadow-dropdown"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feat.icon className="size-5" />
                  </div>
                  <Badge>{feat.badge}</Badge>
                </div>

                <h3 className="text-section-title mb-2.5">{feat.title}</h3>
                <p className="text-small">{feat.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
