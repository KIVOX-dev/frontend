"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TiltCard } from "./TiltCard";
import { MagneticButton } from "./MagneticButton";

const entrance = { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { ...entrance, delay },
});

const stats = [
  { value: "100K+", label: "Students" },
  { value: "250+", label: "Companies" },
  { value: "10M+", label: "Questions" },
  { value: "95%", label: "Placement Success" },
];

const trustedLogos = [
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "HCL", "Tech Mahindra", "Capgemini", "IBM", "Deloitte",
];

function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const match = value.match(/([\d.]+)/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const target = parseFloat(match[1]);
    const suffix = value.replace(match[0], "");
    const duration = 1600;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(eased * target).toLocaleString() + suffix);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, inView]);

  return <>{display}</>;
}

function FloatingDashboard() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">
      {/* Glow blobs behind the dashboard */}
      <div className="absolute -top-16 -right-10 w-72 h-72 bg-nova-aurora-2 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-nova-aurora-1 rounded-full blur-[80px] pointer-events-none" />

      {/* Main card — Resume Score, the flagship widget */}
      <TiltCard maxTilt={7}>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="nova-glass p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-nova-text-faint text-[11px] uppercase tracking-[0.16em] font-bold font-inter">
              Resume Score
            </p>
            <span className="nova-chip">AI Analyzed</span>
          </div>

          <div className="flex items-center gap-5 mb-6">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - 0.92) }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0145F2" />
                    <stop offset="100%" stopColor="#3D66F5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-extrabold text-xl font-grotesk">92</span>
              </div>
            </div>
            <div>
              <p className="text-white font-bold font-grotesk">ATS Optimized</p>
              <p className="text-nova-text-faint text-xs font-inter">Top 8% of applicants</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Keyword Match", pct: 88 },
              { label: "Formatting", pct: 95 },
              { label: "Impact Statements", pct: 79 },
            ].map((row, i) => (
              <div key={row.label}>
                <div className="flex justify-between text-[11px] mb-1.5 font-inter">
                  <span className="text-nova-text-muted">{row.label}</span>
                  <span className="text-white font-semibold">{row.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-nova-btn-gradient"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </TiltCard>

      {/* Floating widget — AI Interview */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="absolute -top-6 -left-10 nova-glass px-4 py-3 w-40"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-scale-400 opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-scale-400" />
          </span>
          <p className="text-[10px] uppercase tracking-wider font-bold text-nova-text-faint font-inter">AI Interview</p>
        </div>
        <p className="text-white text-sm font-bold font-grotesk">Confidence 87%</p>
      </motion.div>

      {/* Floating widget — Job Matches */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-8 -right-8 nova-glass px-4 py-3"
      >
        <p className="text-[10px] uppercase tracking-wider font-bold text-nova-text-faint font-inter mb-0.5">Job Matches</p>
        <p className="text-white text-sm font-bold font-grotesk">
          <span className="text-scale-400">14</span> new today
        </p>
      </motion.div>

      {/* Floating widget — Aptitude Progress */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute top-1/3 -right-14 nova-glass px-3.5 py-2.5 hidden lg:block"
      >
        <p className="text-[10px] uppercase tracking-wider font-bold text-nova-text-faint font-inter mb-0.5">Aptitude</p>
        <p className="text-white text-xs font-bold font-grotesk">Level 7 · Streak 12d</p>
      </motion.div>
    </div>
  );
}

export default function LandingHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const auroraX = useTransform(smoothX, [-0.5, 0.5], [-30, 30]);
  const auroraY = useTransform(smoothY, [-0.5, 0.5], [-30, 30]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={ref}
      id="main-content"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen bg-scale-50 flex items-center overflow-hidden pt-16"
    >
      {/* Aurora mesh background — three drifting radial glows. Only the
          floating dashboard (the "box") stays dark; the page itself is
          light, so the grid pattern and star field (both designed to read
          against a dark navy bg) are dropped here rather than ported over
          invisible. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          style={{ x: auroraX, y: auroraY }}
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] bg-nova-aurora-1 rounded-full blur-[120px] animate-aurora opacity-70"
        />
        <motion.div
          style={{ x: auroraX, y: auroraY }}
          className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-nova-aurora-2 rounded-full blur-[120px] animate-aurora-slow opacity-70"
        />
        <div className="absolute bottom-0 left-1/3 w-[45vw] h-[45vw] bg-nova-aurora-3 rounded-full blur-[130px] animate-aurora opacity-70" />
      </div>

      <div className="relative z-10 ui-container w-full py-20 lg:py-24">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-14 xl:gap-20 items-center">
          {/* Left: copy */}
          <div>
            <motion.div {...fadeUp(0)} className="scale-eyebrow mb-7">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-scale-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-scale-400" />
              </span>
              AI-Powered Recruitment Platform
            </motion.div>

            <motion.h1
              {...fadeUp(0.1)}
              className="font-grotesk font-semibold text-scale-ink tracking-tight leading-[1.05] text-5xl lg:text-6xl xl:text-[4.5rem] mb-6"
            >
              Build Your <span className="nova-mark">Future</span> with{" "}
              <span className="nova-mark">AI Recruitment</span>
            </motion.h1>

            <motion.p {...fadeUp(0.18)} className="text-scale-ink-muted text-base lg:text-lg leading-relaxed font-inter mb-9 max-w-xl">
              Practice aptitude, prepare for interviews, create ATS-friendly resumes, discover
              jobs, and connect with top companies — all in one intelligent platform.
            </motion.p>

            <motion.div {...fadeUp(0.26)} className="flex flex-wrap gap-3 mb-14">
              <MagneticButton>
                <Link href="/learner?mode=signup" className="nova-btn-primary">
                  Start Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link href="/institutional" className="nova-btn-secondary !bg-white !text-scale-900 !border-scale-300/60 hover:!bg-scale-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Institutional Login
                </Link>
              </MagneticButton>
            </motion.div>

            {/* Trusted companies — marquee */}
            <motion.div {...fadeUp(0.32)} className="mb-10">
              <p className="text-scale-ink-faint text-[11px] uppercase tracking-looser font-bold font-inter mb-4">
                Trusted by talent teams at
              </p>
              <div className="relative overflow-hidden max-w-xl">
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-scale-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-scale-50 to-transparent z-10 pointer-events-none" />
                <div className="flex animate-marquee gap-3 w-max">
                  {[...trustedLogos, ...trustedLogos].map((logo, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center px-4 py-2 rounded-lg border border-scale-line bg-white text-scale-ink-muted font-semibold text-xs whitespace-nowrap font-inter"
                    >
                      {logo}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Animated stats */}
            <motion.div
              {...fadeUp(0.4)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 pt-8 border-t border-scale-line"
            >
              {stats.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-2xl font-extrabold text-scale-ink font-grotesk tracking-tight tabular-nums">
                    <AnimatedCounter value={item.value} inView={inView} />
                  </span>
                  <span className="text-[13px] text-scale-ink-faint font-inter mt-0.5">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: floating dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <FloatingDashboard />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-scale-ink-faint text-[10px] uppercase tracking-looser font-semibold font-inter">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-5 border border-scale-line rounded-full flex items-center justify-center"
        >
          <div className="w-1 h-1 rounded-full bg-scale-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
