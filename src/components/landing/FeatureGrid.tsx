"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CalendarCheck, GraduationCap, Users, BarChart3, MessageSquare, FileBarChart, FolderOpen } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";

const features = [
  {
    icon: CalendarCheck,
    badge: "Attendance",
    title: "Smart Attendance",
    desc: "Automated attendance capture for students and staff, with real-time percentage tracking and low-attendance alerts.",
  },
  {
    icon: GraduationCap,
    badge: "Academics",
    title: "Academic Management",
    desc: "Course scheduling, gradebooks, exam management, and academic progress tracking in one connected workflow.",
  },
  {
    icon: Users,
    badge: "HR",
    title: "HR Automation",
    desc: "Recruitment pipelines, payroll processing, and employee records — automated end to end for the HR team.",
  },
  {
    icon: BarChart3,
    badge: "Insights",
    title: "Analytics Dashboard",
    desc: "Live, role-aware dashboards that turn institutional data into decisions — no spreadsheets required.",
  },
  {
    icon: MessageSquare,
    badge: "Messaging",
    title: "Communication",
    desc: "Announcements, notifications, and direct messaging keep students, faculty, and staff aligned.",
  },
  {
    icon: FileBarChart,
    badge: "Reporting",
    title: "Reports",
    desc: "Generate department, batch, and institution-wide reports on demand, exportable in the formats you need.",
  },
  {
    icon: FolderOpen,
    badge: "Documents",
    title: "Document Management",
    desc: "A secure, searchable home for every institutional record, policy, and student document.",
  },
];

export default function FeatureGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className="bg-[var(--color-bg-secondary)] ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Platform Features
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Everything an institution needs, built in.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            Every feature is purpose-built to connect the people who run your institution with the
            people it serves.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <TiltCard key={feat.title} maxTilt={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                className="group relative h-full rounded-lg border border-line bg-white p-7 shadow-card transition-shadow duration-150 hover:shadow-dropdown"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feat.icon className="size-5" />
                  </div>
                  <Badge>{feat.badge}</Badge>
                </div>

                <h3 className="text-section-title mb-2.5">{feat.title}</h3>
                <p className="text-small">{feat.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
