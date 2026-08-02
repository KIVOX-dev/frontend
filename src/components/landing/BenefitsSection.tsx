"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Smile, Gauge, TrendingUp } from "lucide-react";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const benefits = [
  {
    icon: Clock,
    metric: "-70%",
    title: "Save administrative time",
    desc: "Automated attendance, payroll, and admissions workflows remove hours of manual, repetitive work every week.",
  },
  {
    icon: Smile,
    metric: "+40%",
    title: "Improve student experience",
    desc: "One portal for courses, exams, and results means students spend less time hunting for information.",
  },
  {
    icon: Gauge,
    metric: "3x",
    title: "Increase operational efficiency",
    desc: "Every department works from the same live data, so nothing gets duplicated, delayed, or lost between teams.",
  },
  {
    icon: TrendingUp,
    metric: "99%",
    title: "Make data-driven decisions",
    desc: "Real-time dashboards give administrators the visibility to act on trends instead of end-of-term reports.",
  },
];

export default function BenefitsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[var(--color-bg-secondary)] ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Why Institutions Choose Us
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Built for outcomes, not just features.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            The measure of a platform is what changes after you adopt it.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full flex items-start gap-5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <b.icon className="size-6" />
                  </div>
                  <span className="text-heading-m text-primary">{b.metric}</span>
                </div>
                <div>
                  <h3 className="text-section-title mb-2">{b.title}</h3>
                  <p className="text-small">{b.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
