"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TiltCard } from "./TiltCard";

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
    const duration = 1800;
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Expo-out — matches the easing language used everywhere else
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
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

const logos = [
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "HCL", "Tech Mahindra", "Capgemini", "IBM", "Deloitte",
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant",
  "HCL", "Tech Mahindra", "Capgemini", "IBM", "Deloitte",
];

export default function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="trust" className="bg-scale-100 ui-section border-t border-scale-line overflow-hidden">
      <div className="ui-container">

        {/* Stats — separate cards, spaced apart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
        >
          {stats.map((s, i) => (
            <TiltCard key={s.label} maxTilt={6}>
              <motion.div
                initial={{ opacity: 0, y: 16, rotateX: -25 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 800 }}
                className="group scale-card-interactive h-full text-center p-7"
              >
                <div className="w-11 h-11 rounded-xl bg-scale-100 border border-scale-300/50 text-scale-900 flex items-center justify-center mx-auto mb-4 transition-all duration-300 ease-expo group-hover:bg-scale-900 group-hover:border-scale-900 group-hover:text-scale-500 group-hover:-translate-y-0.5">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path d={s.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-3xl font-extrabold text-scale-ink tracking-tightest mb-1 tabular-nums">
                  <AnimatedCounter value={s.value} inView={inView} />
                </p>
                <p className="text-scale-ink-faint text-[13px]">{s.label}</p>
              </motion.div>
            </TiltCard>
          ))}
        </motion.div>

        {/* Logo marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <p className="text-center text-scale-ink-faint text-[11px] uppercase tracking-looser font-bold mb-8">
            Trusted by talent teams at
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-scale-100 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-scale-100 to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee gap-4 w-max">
              {logos.map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center px-6 py-3 rounded-xl border border-scale-line bg-white text-scale-ink-faint font-bold text-sm whitespace-nowrap hover:border-scale-300 hover:text-scale-900 hover:bg-scale-50 transition-all duration-300 ease-expo cursor-default"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
