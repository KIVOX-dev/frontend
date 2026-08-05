"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Settings2, Users2, Workflow, LineChart } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Setup Institution",
    desc: "Register your institution and add departments — each with its own code and duration — from the admin console.",
  },
  {
    number: "02",
    icon: Users2,
    title: "Connect Users",
    desc: "Onboard students individually or via bulk CSV upload, then add faculty and staff accounts from Manage Users.",
  },
  {
    number: "03",
    icon: Workflow,
    title: "Automate Assessments",
    desc: "Create a test once and assign it to entire departments and batches in one action — no manual roster building.",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Track Performance",
    desc: "Live dashboards surface placement trends, assessment results, and student performance across every department, in real time.",
  },
];

export default function ProcessSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className="bg-white ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge tone="success" className="mb-5">
            How It Works
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Live in weeks, not semesters.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            A straightforward four-step rollout — from first setup to institution-wide adoption.
          </p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-5 top-2 bottom-2 w-px origin-top bg-linear-to-b from-primary via-line to-transparent"
          />

          <div className="flex flex-col gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.12 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex gap-5 sm:gap-7 group"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 shrink-0 flex size-10 items-center justify-center rounded-full bg-white border border-line shadow-card"
                >
                  <span className="text-[11px] font-extrabold text-ink tracking-tight">{step.number}</span>
                </motion.div>

                <TiltCard maxTilt={4} className="flex-1 mb-1">
                  <div className="h-full rounded-lg border border-line bg-white p-6 lg:p-7 shadow-card transition-shadow duration-150 hover:shadow-dropdown">
                    <div className="flex items-center gap-3 mb-2.5">
                      <step.icon className="size-5 text-primary" />
                      <h3 className="text-section-title">{step.title}</h3>
                    </div>
                    <p className="text-small">{step.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
