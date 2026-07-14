"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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
    <section ref={ref} id="features" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-DEFAULT text-sm font-medium mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5"/></svg>
            Platform Features
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-jet tracking-tight mb-4">
            Designed for{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">Scale & Success</span>
          </h2>
          <p className="text-gray-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Every feature is purpose-built to bridge the gap between academic learning and industry readiness.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 * i, ease: "easeOut" }}
              className="group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-card-lift hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 cursor-default overflow-hidden"
            >
              {/* Green left border accent on hover */}
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-green-gradient rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-50 text-forest-DEFAULT text-[10px] font-bold uppercase tracking-wider mb-5">
                {feat.badge}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-DEFAULT flex items-center justify-center mb-5 group-hover:bg-forest-DEFAULT group-hover:text-white transition-all duration-300 shadow-sm">
                {feat.icon}
              </div>

              <h3 className="text-lg font-bold text-jet mb-2.5 group-hover:text-forest-DEFAULT transition-colors duration-300">
                {feat.title}
              </h3>
              <p className="text-gray-muted text-sm leading-relaxed">{feat.desc}</p>

              {/* Background glow on hover */}
              <div className="absolute inset-0 bg-forest-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
