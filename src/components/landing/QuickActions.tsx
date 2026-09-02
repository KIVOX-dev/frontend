"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Sparkle,
  ChartLineUp,
  FileText,
  UserFocus,
  Trophy,
  Briefcase,
  ClipboardText,
} from "@phosphor-icons/react";

const ACTIONS = [
  { label: "Practice quant aptitude", icon: ChartLineUp, href: "/learner" },
  { label: "Build my resume", icon: FileText, href: "/learner" },
  { label: "Try a mock interview", icon: UserFocus, href: "/learner" },
  { label: "Check my rank", icon: Trophy, href: "/learner" },
  { label: "Browse open jobs", icon: Briefcase, href: "/learner" },
  { label: "Assign an assessment", icon: ClipboardText, href: "/institutional" },
];

// Mirrors coursera.org's "Ask Coursera" prompt-chip row exactly, including
// its purple accent (Coursera's own --cds-color-purple-* tokens mark every
// AI-assistant moment, distinct from the blue everywhere else) — quick
// entry points into real platform sections instead of an AI query box,
// since there's no course-search assistant to route these to.
export default function QuickActions() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="bg-white pb-14 lg:pb-16">
      <div className="ui-container">
        <h2 className="text-section-title mb-4">Jump right in</h2>
        <div className="flex flex-wrap gap-2.5">
          {ACTIONS.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={a.href}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-accent-purple-100)] bg-[var(--color-accent-purple-25)] pl-3.5 pr-4 py-3 text-sm font-medium text-ink hover:border-[var(--color-accent-purple-600)]/40 hover:bg-[var(--color-accent-purple-50)] transition-colors duration-200"
              >
                <Sparkle className="size-4 text-[var(--color-accent-purple-600)]" weight="fill" />
                {a.label}
                <a.icon className="size-4 text-[var(--color-accent-purple-700)]" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
