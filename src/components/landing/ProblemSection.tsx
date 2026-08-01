"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";

const problems = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "No Structured Prep Path",
    desc: "Students spend hours aimlessly browsing resources with no clear roadmap to interview readiness.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Zero Visibility for Institutions",
    desc: "Colleges can't measure student performance at batch level or identify who needs intervention before placements.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Recruiters Waste Weeks",
    desc: "HR teams sift through unverified profiles and repeat screening rounds, burning time and budget on every hire.",
  },
];

export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-scale-50 ui-section border-t border-scale-line">
      <div className="ui-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="scale-chip mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-scale-ink-faint" />
            The Problem
          </div>
          <RevealHeading className="ui-section-title mb-4">
            The placement ecosystem is <span className="scale-mark">broken</span>
          </RevealHeading>
          <p className="ui-lede">
            Students, institutions, and recruiters each face their own version of the same disconnect.
            UpScaler fixes all three — simultaneously.
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {problems.map((p, i) => (
            <TiltCard key={p.title} maxTilt={6}>
              <motion.div
                initial={{ opacity: 0, y: 24, rotateX: -25 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 800 }}
                className="group scale-card-interactive h-full p-7 overflow-hidden"
              >
                {/* Numeral watermark keeps the eye moving left-to-right */}
                <span className="absolute top-5 right-6 text-[42px] font-black leading-none text-scale-100 select-none transition-colors duration-300 group-hover:text-scale-100">
                  0{i + 1}
                </span>

                <div className="relative w-11 h-11 rounded-xl bg-scale-50 border border-scale-line text-scale-ink-muted flex items-center justify-center mb-5 transition-all duration-300 ease-expo group-hover:bg-scale-900 group-hover:border-scale-900 group-hover:text-scale-500">
                  {p.icon}
                </div>
                <h3 className="relative text-lg font-bold text-scale-ink mb-2.5">{p.title}</h3>
                <p className="relative text-scale-ink-muted text-sm leading-relaxed">{p.desc}</p>

                {/* Lime underline sweeps in on hover */}
                <span className="absolute left-7 right-7 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-scale-500 transition-transform duration-500 ease-expo group-hover:scale-x-100" />
              </motion.div>
            </TiltCard>
          ))}
        </div>

        {/* Solution bridge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl bg-scale-500 shadow-scale-btn overflow-hidden"
        >
          {/* Canvas-cloud rail — the accent, not a fill */}
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-scale-50" />

          <div className="p-8 lg:p-10 pl-9 lg:pl-12 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-xl text-white text-xs font-semibold tracking-wide mb-4 uppercase tracking-looser text-[11px]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                The UpScaler Solution
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-3">
                One platform. Every stakeholder. Zero gaps.
              </h3>
              <p className="text-white/80 leading-relaxed max-w-2xl">
                AI-driven assessment, real-time analytics, and verified talent pipelines — unified in a single ecosystem
                that aligns students, institutions, and recruiters toward the same outcome.
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6 shrink-0">
              {[["Students", "🎓"], ["Institutions", "🏫"], ["Recruiters", "🏢"]].map(([label, emoji]) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl">
                    {emoji}
                  </div>
                  <span className="text-[11px] font-semibold text-white/85">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
