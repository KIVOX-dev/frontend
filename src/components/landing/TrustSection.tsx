"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: "1000+", label: "Students Trained", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { value: "20+", label: "Institutions", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { value: "90%", label: "Placement Rate", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" },
  { value: "4.5/5", label: "Average Rating", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
];

function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!inView) return;

    const numRegex = /([\d.]+)/;
    const match = value.match(numRegex);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const isDecimal = match[1].includes(".");
    const suffix = value.replace(match[0], "");

    let start = 0;
    const duration = 2000; // 2 seconds animation
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing out quad
      const easeProgress = progress * (2 - progress);
      const currentNum = start + easeProgress * targetNum;

      if (isDecimal) {
        setDisplayValue(currentNum.toFixed(1) + suffix);
      } else {
        setDisplayValue(Math.floor(currentNum).toLocaleString() + suffix);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, inView]);

  return <>{displayValue}</>;
}

const testimonials = [
  {
    quote: "BUDDIES transformed our placement cell. We went from 60% placement to 94% in a single academic year. The batch analytics alone saved our faculty hundreds of hours.",
    name: "Dr. Ramesh Nair",
    role: "Dean of Placements",
    institution: "KL University",
    initials: "RN",
    color: "from-forest-DEFAULT to-forest-500",
  },
  {
    quote: "The AI-adaptive tests are on another level. I went from failing practice tests to clearing TCS and Infosys in the same month. The feedback is incredibly specific and actionable.",
    name: "Priya Sharma",
    role: "B.Tech CSE, 2026",
    institution: "Now at TCS Digital",
    initials: "PS",
    color: "from-blue-800 to-blue-600",
  },
  {
    quote: "We source 80% of our campus hires through BUDDIES now. Verified scores mean we skip the first two screening rounds entirely. ROI on this platform is extraordinary.",
    name: "Kavya Menon",
    role: "Head of Campus Hiring",
    institution: "Infosys BPM",
    initials: "KM",
    color: "from-purple-800 to-purple-600",
  },
];

const logos = [
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "HCL", "Tech Mahindra", "Capgemini", "IBM", "Deloitte",
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "HCL", "Tech Mahindra", "Capgemini", "IBM", "Deloitte",
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < count ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="trust" className="bg-white py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.07 * i, ease: "easeOut" }}
              className="group text-center p-6 rounded-2xl border border-gray-100 shadow-card-lift hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-DEFAULT flex items-center justify-center mx-auto mb-4 group-hover:bg-forest-DEFAULT group-hover:text-white transition-all duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d={s.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-3xl font-black text-jet mb-1">
                <AnimatedCounter value={s.value} inView={inView} />
              </p>
              <p className="text-gray-muted text-sm">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Logo marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <p className="text-center text-gray-muted text-sm uppercase tracking-widest font-medium mb-8">
            Trusted by talent teams at
          </p>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee gap-8 w-max">
              {logos.map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center px-6 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 font-bold text-sm whitespace-nowrap hover:border-forest-200 hover:text-forest-DEFAULT hover:bg-forest-50 transition-all duration-200 cursor-default"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-sm font-medium mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            What People Say
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-jet tracking-tight">
            Loved by{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">every stakeholder</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: "easeOut" }}
              className="group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-card-lift hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              {/* Quote mark */}
              <div className="absolute top-6 right-7 text-forest-50 text-6xl font-black leading-none select-none">&ldquo;</div>

              <StarRating />
              <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-6 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-jet text-sm">{t.name}</p>
                  <p className="text-gray-muted text-xs">{t.role} · {t.institution}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
