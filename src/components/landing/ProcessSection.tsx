"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";

const steps = [
  {
    number: "01",
    title: "Institution Onboards",
    desc: "The institution registers and sets up their profile — departments, batches, and faculty accounts — in under 10 minutes with our guided setup wizard.",
    tags: ["Quick Setup", "No IT required", "Bulk Import"],
  },
  {
    number: "02",
    title: "Students Get Assessed",
    desc: "AI-powered adaptive tests pinpoint each student's current aptitude level across quantitative, logical, and verbal domains. No two students get the same test.",
    tags: ["AI Adaptive", "Personalised", "Instant Results"],
  },
  {
    number: "03",
    title: "Targeted Training Begins",
    desc: "Based on assessment results, UpScaler generates a personalised learning roadmap. Students practice daily with curated question banks and mock interviews.",
    tags: ["Learning Path", "Daily Practice", "Mock Interviews"],
  },
  {
    number: "04",
    title: "Institutions Track Progress",
    desc: "Faculty and administrators get real-time dashboards showing who's improving, who needs intervention, and how each batch compares — all without manual reports.",
    tags: ["Live Dashboards", "Early Alerts", "Batch Insights"],
  },
  {
    number: "05",
    title: "Recruiters Find Top Talent",
    desc: "Verified, pre-scored candidate profiles surface directly to HR teams. Recruiters filter by score, domain, and college — and schedule interviews in one click.",
    tags: ["Verified Profiles", "Smart Filters", "One-Click Hire"],
  },
];

export default function ProcessSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="process" className="bg-scale-50 ui-section border-t border-scale-line">
      <div className="ui-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="scale-eyebrow mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            How It Works
          </div>
          <RevealHeading className="ui-section-title mb-4">
            From signup to <span className="scale-mark">placement</span>
          </RevealHeading>
          <p className="ui-lede">
            A seamless five-step journey — from institutional setup to successful placements.
          </p>
        </motion.div>

        {/* Steps — single left rail, easier to scan than a zig-zag */}
        <div className="relative max-w-3xl mx-auto">
          {/* Rail */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-5 top-2 bottom-2 w-px origin-top bg-gradient-to-b from-scale-400 via-scale-line to-transparent"
          />

          <div className="flex flex-col gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18, rotateX: -20 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.12 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 900 }}
                className="relative flex gap-5 sm:gap-7 group"
              >
                {/* Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-white border border-scale-300/50 shadow-scale-card flex items-center justify-center transition-all duration-300 ease-expo group-hover:border-scale-400"
                >
                  <span className="text-[11px] font-extrabold text-scale-ink tracking-tight">
                    {step.number}
                  </span>
                </motion.div>

                {/* Content card */}
                <TiltCard maxTilt={4} className="flex-1 mb-1">
                  <div className="scale-card-interactive h-full p-6 lg:p-7">
                    <h3 className="text-lg lg:text-xl font-bold text-scale-ink mb-2.5">{step.title}</h3>
                    <p className="text-scale-ink-muted text-sm leading-relaxed mb-4">{step.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag) => (
                        <span key={tag} className="scale-chip-lime">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
