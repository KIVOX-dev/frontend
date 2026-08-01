"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: "AI Core",
    title: "Adaptive AI Assessment",
    desc: "Intelligent aptitude evaluation with adaptive difficulty that maps precisely to each student's skill ceiling.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: "Analytics",
    title: "Real-Time Batch Analytics",
    desc: "Institutional dashboards with batch, department, and individual-level performance tracking — live.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    badge: "Security",
    title: "Enterprise-Grade Security",
    desc: "Role-based access control, secure session management, and SOC-2 compliant data architecture.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: "Management",
    title: "Unified Control Centre",
    desc: "Manage departments, batches, student registers, and faculty from one beautifully designed interface.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    badge: "Career",
    title: "Career Path Intelligence",
    desc: "AI-driven role alignment, opportunity tracking, and guided placement assistance for every student.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    badge: "Resources",
    title: "Smart Resource Centre",
    desc: "Integrated material management, seamless data export, and content libraries for institutional growth.",
  },
];

export default function FeatureGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className="bg-scale-100 ui-section border-t border-scale-line">
      <div className="ui-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="scale-eyebrow mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
            Platform Features
          </div>
          <RevealHeading className="ui-section-title mb-4">
            Designed for <span className="scale-mark">Scale &amp; Success</span>
          </RevealHeading>
          <p className="ui-lede">
            Every feature is purpose-built to bridge the gap between academic learning and industry readiness.
          </p>
        </motion.div>

        {/* Feature grid — separate cards, spaced apart */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <TiltCard key={feat.title} maxTilt={6}>
              <motion.div
                initial={{ opacity: 0, y: 20, rotateX: -25 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 800 }}
                className="group scale-card-interactive relative h-full p-7 lg:p-8 overflow-hidden cursor-default"
              >
                {/* Dark-forest rail on hover */}
                <span className="absolute left-0 top-6 bottom-6 w-[3px] origin-top scale-y-0 rounded-full bg-scale-gradient transition-transform duration-500 ease-expo group-hover:scale-y-100" />

                <div className="flex items-start justify-between gap-4 mb-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-scale-50 border border-scale-line text-scale-ink flex items-center justify-center transition-all duration-300 ease-expo group-hover:bg-scale-900 group-hover:border-scale-900 group-hover:text-scale-500 group-hover:-translate-y-0.5">
                    {feat.icon}
                  </div>
                  {/* Badge */}
                  <span className="scale-chip-lime uppercase tracking-looser text-[10px]">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-scale-ink mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-scale-ink-muted text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
