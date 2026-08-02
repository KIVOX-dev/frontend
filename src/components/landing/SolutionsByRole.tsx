"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Briefcase, GraduationCap, Users, Building2, Check, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RevealHeading } from "./RevealHeading";

const roles = [
  {
    id: "hr",
    icon: Briefcase,
    role: "HR Team",
    title: "HR Management",
    description: "Manage employees, attendance, recruitment, payroll, and workforce operations.",
    benefits: [
      "Employee database",
      "Attendance tracking",
      "Leave management",
      "Recruitment workflow",
      "Payroll insights",
    ],
    cta: "Explore HR Solution",
    href: "/hr",
    visual: (
      <div className="space-y-1.5">
        {[
          { name: "Ananya Rao", tag: "Active" },
          { name: "Vikram Shah", tag: "On Leave" },
          { name: "Deepa Nair", tag: "Active" },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5">
            <span className="size-6 rounded-full bg-primary/15 shrink-0" />
            <span className="text-caption font-semibold text-ink flex-1 truncate">{row.name}</span>
            <span className="text-[10px] font-semibold text-ink-faint">{row.tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "student",
    icon: GraduationCap,
    role: "Student",
    title: "Student Experience",
    description: "Give students a complete digital campus experience.",
    benefits: [
      "Course management",
      "Attendance tracking",
      "Assignments",
      "Exam schedules",
      "Academic progress",
    ],
    cta: "Explore Student Solution",
    href: "/learner",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Data Structures</span>
          <span className="text-[10px] font-semibold text-primary">92%</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Operating Systems</span>
          <span className="text-[10px] font-semibold text-ink-faint">Assignment due</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Exam Schedule</span>
          <span className="text-[10px] font-semibold text-ink-faint">3 upcoming</span>
        </div>
      </div>
    ),
  },
  {
    id: "faculty",
    icon: Users,
    role: "Faculty",
    title: "Faculty Management",
    description: "Help teachers manage classes, assessments, and student performance.",
    benefits: [
      "Class scheduling",
      "Attendance",
      "Grade management",
      "Assignments",
      "Student analytics",
    ],
    cta: "Explore Faculty Solution",
    href: "/faculty",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">CSE-3A · 9:00 AM</span>
          <span className="text-[10px] font-semibold text-primary">Live</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Gradebook</span>
          <span className="text-[10px] font-semibold text-ink-faint">42 submissions</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Avg. Performance</span>
          <span className="text-[10px] font-semibold text-ink-faint">B+</span>
        </div>
      </div>
    ),
  },
  {
    id: "admin",
    icon: Building2,
    role: "College Admin",
    title: "Institution Management",
    description: "Control every department and operation from one centralized system.",
    benefits: [
      "Admissions",
      "Finance",
      "Reports",
      "Department analytics",
      "Institutional insights",
    ],
    cta: "Explore Admin Solution",
    href: "/institutional",
    visual: (
      <div className="space-y-1.5">
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Admissions (Q2)</span>
          <span className="text-[10px] font-semibold text-primary">+18%</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Pending Approvals</span>
          <span className="text-[10px] font-semibold text-ink-faint">7</span>
        </div>
        <div className="rounded-md border border-line bg-white px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-caption font-semibold text-ink">Departments</span>
          <span className="text-[10px] font-semibold text-ink-faint">12 active</span>
        </div>
      </div>
    ),
  },
];

export default function SolutionsByRole() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="solutions" className="bg-white ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Built for every role
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Solutions designed for every role in your institution.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            Whoever you are on campus, there&apos;s a workspace built around exactly what you need to do.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card interactive className="h-full flex flex-col">
                <div className="rounded-md border border-line bg-[var(--color-sidebar)] p-3 mb-5">
                  {r.visual}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <r.icon className="size-[18px]" />
                  </span>
                  <span className="text-caption font-bold uppercase tracking-wide">{r.role}</span>
                </div>

                <h3 className="text-section-title mb-2">{r.title}</h3>
                <p className="text-small mb-4">{r.description}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {r.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-small text-ink">
                      <Check className="size-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <Link href={r.href} className="w-full">
                  <Button variant="secondary" className="w-full justify-center">
                    {r.cta}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
