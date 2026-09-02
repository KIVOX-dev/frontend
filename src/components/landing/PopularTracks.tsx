"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Star } from "@phosphor-icons/react";
import { RevealHeading } from "./RevealHeading";

type TrackItem = {
  badge: string;
  title: string;
  meta: string;
  rating: string;
};

type Column = {
  title: string;
  href: string;
  items: TrackItem[];
};

const COLUMNS: Column[] = [
  {
    title: "Most popular",
    href: "/learner",
    items: [
      { badge: "QA", title: "Quantitative Aptitude", meta: "Practice Track · 40 topics", rating: "4.8" },
      { badge: "LR", title: "Logical Reasoning", meta: "Practice Track · 28 topics", rating: "4.7" },
      { badge: "VA", title: "Verbal Ability", meta: "Practice Track · 22 topics", rating: "4.8" },
    ],
  },
  {
    title: "New this month",
    href: "/learner",
    items: [
      { badge: "AI", title: "AI Mock Interview v2", meta: "New Feature · Real-time feedback", rating: "4.9" },
      { badge: "CV", title: "Resume Builder Templates", meta: "New Feature · 12 templates", rating: "4.6" },
      { badge: "MNC", title: "Company Question Banks", meta: "New Track · TCS, Infosys, Wipro", rating: "4.7" },
    ],
  },
  {
    title: "Trending with recruiters",
    href: "/hr",
    items: [
      { badge: "SDE", title: "Full Stack Developer", meta: "24 applicants this week", rating: "4.8" },
      { badge: "DA", title: "Data Analyst", meta: "12 applicants this week", rating: "4.6" },
      { badge: "INT", title: "SDE Intern", meta: "31 applicants this week", rating: "4.7" },
    ],
  },
];

// Mirrors coursera.org's "New and popular" 3-column grid — same shape
// (column header + link, rows of badge + title + meta + rating), populated
// with real platform categories instead of a fabricated course catalog.
export default function PopularTracks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[#f0f6ff] ui-section border-t border-line">
      <div className="ui-container">
        <RevealHeading className="text-heading-l mb-10">New and popular</RevealHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {COLUMNS.map((col, ci) => (
            <div key={col.title}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-section-title">{col.title}</h3>
                <Link href={col.href} className="group inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
                  View all
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {col.items.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.05 * ci + 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={col.href}
                      className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 hover:border-primary/30 hover:shadow-card transition-all duration-200"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-extrabold">
                        {item.badge}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink truncate">{item.title}</p>
                        <p className="text-caption text-ink-faint truncate">{item.meta}</p>
                      </div>
                      <span className="flex items-center gap-1 text-caption font-semibold text-ink-muted shrink-0">
                        <Star className="size-3" weight="fill" />
                        {item.rating}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
