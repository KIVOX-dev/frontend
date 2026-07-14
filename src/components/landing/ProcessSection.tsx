"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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
    desc: "Based on assessment results, BUDDIES generates a personalised learning roadmap. Students practice daily with curated question banks and mock interviews.",
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
    <section ref={ref} id="process" className="bg-off-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-DEFAULT text-sm font-medium mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            How It Works
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-jet tracking-tight mb-4">
            From signup to{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">placement</span>
          </h2>
          <p className="text-gray-muted text-lg max-w-2xl mx-auto leading-relaxed">
            A seamless five-step journey — from institutional setup to successful placements.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-forest-DEFAULT/20 via-forest-DEFAULT/40 to-transparent hidden lg:block" />

          <div className="flex flex-col gap-12 lg:gap-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isLeft ? -32 : 32 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.65, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                  className={`relative flex items-center gap-8 lg:gap-0 ${isLeft ? "lg:flex-row" : "lg:flex-row-reverse"} lg:mb-12`}
                >
                  {/* Content card */}
                  <div className={`lg:w-[46%] ${isLeft ? "lg:pr-12 lg:text-right" : "lg:pl-12 lg:text-left"}`}>
                    <div className={`group bg-white rounded-2xl p-7 border border-gray-100 shadow-card-lift hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ${isLeft ? "lg:ml-auto" : ""}`}>
                      {/* Step number */}
                      <div className={`flex items-center gap-3 mb-4 ${isLeft ? "lg:flex-row-reverse lg:justify-start" : ""}`}>
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-green-gradient leading-none">{step.number}</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-forest-DEFAULT/20 to-transparent" />
                      </div>
                      <h3 className="text-xl font-bold text-jet mb-3">{step.title}</h3>
                      <p className="text-gray-muted text-sm leading-relaxed mb-4">{step.desc}</p>
                      <div className={`flex flex-wrap gap-2 ${isLeft ? "lg:justify-end" : ""}`}>
                        {step.tags.map((tag) => (
                          <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-50 text-forest-DEFAULT border border-forest-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center dot (desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={inView ? { scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1, type: "spring", bounce: 0.4 }}
                      className="w-12 h-12 rounded-full bg-green-gradient shadow-green-glow flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-bold">{step.number}</span>
                    </motion.div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden lg:block lg:w-[46%]" />

                  {/* Mobile step indicator */}
                  <div className="lg:hidden flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-gradient flex items-center justify-center text-white text-xs font-bold shadow-green-glow-sm">
                      {step.number}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
