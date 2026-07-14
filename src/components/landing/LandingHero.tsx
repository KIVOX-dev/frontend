"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import type { Transition } from "framer-motion";

const easeOut: Transition = { duration: 0.65, ease: "easeOut" };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { ...easeOut, delay },
});

const trustItems = [
  { value: "1000+", label: "Students Trained" },
  { value: "20+", label: "Institutions" },
  { value: "90%", label: "Placement Rate" },
  { value: "4.5★", label: "Average Rating" },
];

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none">
      {/* Glow backdrop */}
      <div className="absolute inset-0 -m-8 bg-cta-glow blur-3xl opacity-60 rounded-full" />

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative bg-jet/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-dark-card overflow-hidden"
      >
        {/* Card shimmer */}
        <div className="absolute inset-0 bg-card-shine pointer-events-none" />

        {/* Header bar */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-brand/80" />
          <div className="flex-1 mx-4 h-6 bg-white/5 rounded-md flex items-center px-3">
            <span className="text-white/30 text-xs font-mono">buddies.ai/dashboard</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Score", value: "94", unit: "%", color: "text-emerald-400" },
            { label: "Rank", value: "#3", unit: "", color: "text-blue-400" },
            { label: "Tests", value: "47", unit: "", color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-bold text-xl ${s.color}`}>{s.value}<span className="text-xs font-medium ml-0.5">{s.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="space-y-3 mb-4">
          {[
            { label: "Quantitative Aptitude", pct: 88 },
            { label: "Logical Reasoning", pct: 76 },
            { label: "Verbal Ability", pct: 91 },
          ].map((b, i) => (
            <div key={b.label}>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/60">{b.label}</span>
                <span className="text-emerald-400 font-semibold">{b.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.pct}%` }}
                  transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: "easeOut" }}
                  className="h-full rounded-full bg-green-gradient"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Performance Trend</p>
          <svg width="100%" height="52" viewBox="0 0 300 52" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F6B4F" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0F6B4F" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 45 L30 38 L60 40 L90 30 L120 28 L150 22 L180 18 L210 14 L240 10 L270 8 L300 5" stroke="#0F6B4F" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 45 L30 38 L60 40 L90 30 L120 28 L150 22 L180 18 L210 14 L240 10 L270 8 L300 5 L300 52 L0 52Z" fill="url(#chartGrad)"/>
            {[{x:90,y:30},{x:150,y:22},{x:210,y:14},{x:300,y:5}].map((pt,i)=>(
              <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#0F6B4F" stroke="#D9FBE8" strokeWidth="1.5"/>
            ))}
          </svg>
        </div>
      </motion.div>

      {/* Floating badge 1 */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -top-4 -left-6 bg-forest-DEFAULT/90 backdrop-blur-sm border border-forest-500/30 rounded-xl px-3.5 py-2.5 shadow-green-glow-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-brand/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Mock Test Passed</p>
            <p className="text-forest-200 text-[10px]">Score: 94/100 · Just now</p>
          </div>
        </div>
      </motion.div>

      {/* Floating badge 2 */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-4 -right-4 bg-jet/95 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2.5 shadow-dark-card"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p className="text-white text-xs font-semibold">AI Feedback Ready</p>
            <p className="text-white/40 text-[10px]">3 areas to improve</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative min-h-screen bg-jet flex items-center overflow-hidden pt-16"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-hero-mesh" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-forest-DEFAULT/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-forest-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-DEFAULT/20 border border-forest-500/30 text-forest-100 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-brand animate-pulse" />
              AI-Powered Career Intelligence Platform
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeUp(0.1)} className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.06] tracking-tight mb-6">
              Train{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-green-gradient">Smarter</span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-gradient rounded-full opacity-60" />
              </span>
              .<br />
              Score{" "}
              <span className="text-transparent bg-clip-text bg-green-gradient">Higher</span>.<br />
              Get{" "}
              <span className="text-transparent bg-clip-text bg-green-gradient">Hired</span>.
            </motion.h1>

            {/* Subheading */}
            <motion.p {...fadeUp(0.2)} className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
              The most advanced platform for AI-powered aptitude training, career pathing,
              and campus-to-corporate success. Trusted by 500+ institutions.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/learner?mode=signup"
                className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white text-base bg-green-gradient shadow-green-glow hover:shadow-green-glow transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] overflow-hidden"
              >
                <span className="relative z-10">Start Free Trial</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="relative z-10 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/learner"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white/80 text-base border border-white/15 hover:border-white/30 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
              >
                Sign in
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-x-8 gap-y-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-2xl font-bold text-white">{item.value}</span>
                  <span className="text-sm text-white/40">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-4 h-4 border border-white/20 rounded-full flex items-center justify-center"
        >
          <div className="w-1 h-1 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
