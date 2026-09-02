"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: "50,000+", label: "Students Managed" },
  { value: "2,000+", label: "Faculty Members" },
  { value: "500+", label: "Departments" },
  { value: "99%", label: "Data Accuracy" },
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
    const target = parseFloat(match[1].replace(/,/g, ""));
    const suffix = value.replace(match[0], "");
    const duration = 1400;
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

// Dark full-bleed stat bar — matches Coursera's own treatment (see
// coursera.org/campus: a near-black bar with big white numbers, thin
// vertical dividers, and small muted-gray captions) rather than the
// light card-grid style used elsewhere on this page.
export default function PlatformStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[#0d0f12] py-14 lg:py-16">
      <div className="ui-container">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
              className={`px-6 py-2 first:pl-0 ${i > 0 ? "lg:border-l lg:border-white/10" : ""}`}
            >
              <p className="text-heading-l text-white tabular-nums mb-1">
                <AnimatedCounter value={s.value} inView={inView} />
              </p>
              <p className="text-small text-white/50">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
