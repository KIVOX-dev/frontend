"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";
import { HRShowcase } from "./showcases/HRShowcase";
import { StudentShowcase } from "./showcases/StudentShowcase";
import { FacultyShowcase } from "./showcases/FacultyShowcase";
import { AdminShowcase } from "./showcases/AdminShowcase";

const showcases = [
  {
    id: "hr",
    eyebrow: "For HR Teams",
    title: "HR Dashboard",
    description:
      "Post job vacancies, review AI-scored applicant profiles, and hire top campus talent from a single Talent Board — no separate ATS needed.",
    Component: HRShowcase,
  },
  {
    id: "student",
    eyebrow: "For Students",
    title: "Student Portal",
    description:
      "AI-powered aptitude practice, mock interviews, and a resume builder — plus a national leaderboard so students always know exactly where they stand.",
    Component: StudentShowcase,
  },
  {
    id: "faculty",
    eyebrow: "For Faculty",
    title: "Faculty Dashboard",
    description:
      "Onboard students individually or in bulk via CSV, and track every student's aptitude test performance from one dashboard.",
    Component: FacultyShowcase,
  },
  {
    id: "admin",
    eyebrow: "For Administrators",
    title: "College Admin Dashboard",
    description:
      "Run placement drives, create and assign assessments, and manage every department's users — all from one centralized system.",
    Component: AdminShowcase,
  },
];

function ShowcaseRow({
  eyebrow,
  title,
  description,
  Component,
  index,
}: (typeof showcases)[number] & { index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={`grid lg:grid-cols-[2fr_3fr] gap-10 lg:gap-14 items-center ${index > 0 ? "mt-20 lg:mt-28" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Badge tone="success" className="mb-4">
          {eyebrow}
        </Badge>
        <h3 className="text-heading-m mb-3">{title}</h3>
        <p className="text-body text-ink-muted">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0"
      >
        <Component />
      </motion.div>
    </div>
  );
}

export default function ProductShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="platform" className="bg-white ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <RevealHeading className="text-heading-l mb-4">
            One platform. Four real workspaces.
          </RevealHeading>
          <p className="text-body text-ink-muted">
            Every role gets an interface built for how they actually work, not a generic dashboard
            with their name on it.
          </p>
        </motion.div>

        {showcases.map((s, i) => (
          <ShowcaseRow key={s.id} {...s} index={i} />
        ))}
      </div>
    </section>
  );
}
