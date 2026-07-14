"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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
    <section ref={ref} className="bg-off-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-medium mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            The Problem
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-jet tracking-tight mb-4">
            The placement ecosystem is{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">broken</span>
          </h2>
          <p className="text-gray-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Students, institutions, and recruiters each face their own version of the same disconnect.
            BUDDIES fixes all three — simultaneously.
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: "easeOut" }}
              className="group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-card-lift hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                {p.icon}
              </div>
              <h3 className="text-lg font-bold text-jet mb-3">{p.title}</h3>
              <p className="text-gray-muted text-sm leading-relaxed">{p.desc}</p>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                <div className="absolute top-0 right-0 w-8 h-8 bg-red-50 rounded-bl-2xl opacity-50" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Solution bridge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="bg-green-gradient p-0.5 rounded-2xl">
            <div className="bg-white rounded-[14px] p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-DEFAULT text-xs font-semibold uppercase tracking-wider mb-4">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  The BUDDIES Solution
                </div>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-jet mb-3">
                  One platform. Every stakeholder. Zero gaps.
                </h3>
                <p className="text-gray-muted leading-relaxed">
                  AI-driven assessment, real-time analytics, and verified talent pipelines — unified in a single ecosystem
                  that aligns students, institutions, and recruiters toward the same outcome.
                </p>
              </div>
              <div className="flex gap-6 shrink-0">
                {[["Students", "🎓"], ["Institutions", "🏫"], ["Recruiters", "🏢"]].map(([label, emoji]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center text-2xl">{emoji}</div>
                    <span className="text-xs font-semibold text-jet/70">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
