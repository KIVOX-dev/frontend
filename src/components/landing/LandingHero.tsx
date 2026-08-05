"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { ...entrance, delay },
});

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
    const duration = 1200;
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

function InstitutionPreview() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">
      <Card className="p-0 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-[var(--color-sidebar)]">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-primary" />
          </div>
          <div className="flex-1 h-6 rounded-md bg-white border border-line flex items-center px-2.5 min-w-0">
            <span className="text-caption font-mono truncate">app.upscaler.edu/dashboard</span>
          </div>
        </div>

        {/* Placeholder */}
        <div className="h-[420px] flex flex-col items-center justify-center gap-3 bg-[var(--color-sidebar)]">
          <div className="flex size-12 items-center justify-center rounded-lg bg-white border border-line text-ink-faint">
            <LayoutDashboard className="size-5" />
          </div>
          <p className="text-caption text-ink-faint">Product preview coming soon</p>
        </div>
      </Card>
    </div>
  );
}

export default function LandingHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      id="main-content"
      className="relative min-h-screen bg-white flex items-center overflow-hidden pt-16"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: "var(--background-image-hero-mesh)" }}
      />

      <div className="relative z-10 ui-container w-full py-20 lg:py-24">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-14 xl:gap-20 items-center">
          {/* Left: copy */}
          <div>
            <motion.div {...fadeUp(0)} className="mb-7">
              <Badge tone="success">
                <span className="flex size-1.5 rounded-full bg-current" />
                Complete Education Management Platform
              </Badge>
            </motion.div>

            <motion.h1 {...fadeUp(0.05)} className="text-heading-xl lg:text-[52px] mb-6">
              Manage your entire institution from <span className="text-primary">one intelligent platform</span>
            </motion.h1>

            <motion.p {...fadeUp(0.1)} className="text-body text-ink-muted mb-9 max-w-xl">
              HR teams handle workforce operations, students track their academic journey, faculty
              manage classes and grading, and administrators oversee every department — all connected
              in one system, so information never has to be re-entered or chased down twice.
            </motion.p>

            <motion.div {...fadeUp(0.15)} className="flex flex-wrap gap-3 mb-14">
              <Link href="#contact">
                <Button size="lg">
                  Request Demo
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="#platform">
                <Button variant="secondary" size="lg">
                  Explore Platform
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeUp(0.2)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 pt-8 border-t border-line"
            >
              {stats.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-heading-m tabular-nums">
                    <AnimatedCounter value={item.value} inView={inView} />
                  </span>
                  <span className="text-small mt-0.5">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: product preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <InstitutionPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
