"use client";

import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { RevealHeading } from "./RevealHeading";

const tabs = [
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function AnalyticsView() {
  const bars = [72, 85, 61, 90, 78, 95, 83, 68, 77, 88, 92, 74];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avg Score", value: "82.4", delta: "+5.2" },
          { label: "Completion", value: "91%", delta: "+12%" },
          { label: "Dropouts", value: "3.1%", delta: "-2.1%" },
        ].map((s) => (
          <div key={s.label} className="bg-scale-50 rounded-xl p-3.5 border border-scale-line">
            <p className="text-scale-ink-faint text-[10px] uppercase tracking-looser font-semibold mb-1.5">{s.label}</p>
            <p className="text-scale-ink font-extrabold text-xl tracking-tight mb-1">{s.value}</p>
            <span className="text-scale-600 text-[11px] font-bold">{s.delta}</span>
          </div>
        ))}
      </div>
      <div className="bg-scale-50 rounded-xl p-4 border border-scale-line">
        <div className="flex items-end gap-1.5 h-24">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.55, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: `${h}%`, originY: 1 }}
              className="flex-1 rounded-t-[3px] bg-scale-300 hover:bg-scale-500 transition-colors duration-200 relative group cursor-pointer"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-scale-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {h}%
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {months.map((m) => (
            <span key={m} className="text-scale-ink-faint text-[8px] flex-1 text-center">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackingView() {
  const students = [
    { name: "Arjun S.", score: 94, rank: 1, status: "Placed", dept: "CSE" },
    { name: "Priya M.", score: 88, rank: 2, status: "Active", dept: "ECE" },
    { name: "Rohan K.", score: 81, rank: 3, status: "Active", dept: "MECH" },
    { name: "Divya R.", score: 76, rank: 4, status: "Needs Help", dept: "CSE" },
  ];
  const statusColors: Record<string, string> = {
    Placed: "text-scale-600 bg-scale-100 border-scale-300/50",
    Active: "text-scale-ink bg-scale-50 border-scale-line",
    "Needs Help": "text-status-warning bg-status-warning/10 border-status-warning/25",
  };
  return (
    <div className="space-y-2.5">
      {students.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 bg-scale-50 rounded-xl px-4 py-3 border border-scale-line hover:border-scale-300 hover:shadow-scale-card transition-all duration-300 ease-expo"
        >
          <div className="w-8 h-8 rounded-full bg-scale-50 border border-scale-line flex items-center justify-center text-scale-ink font-bold text-[11px] shrink-0">
            #{s.rank}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-scale-ink font-semibold text-sm truncate">{s.name}</p>
            <p className="text-scale-ink-faint text-[11px]">{s.dept}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-scale-ink font-extrabold">{s.score}</p>
            <p className="text-scale-ink-faint text-[10px]">score</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border shrink-0 ${statusColors[s.status]}`}>
            {s.status}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ReportsView() {
  const reports = [
    { title: "Batch Performance Q2 2026", size: "2.4 MB", date: "Today", type: "PDF" },
    { title: "AI Assessment Summary", size: "1.1 MB", date: "Yesterday", type: "XLSX" },
    { title: "Placement Readiness Index", size: "856 KB", date: "3 days ago", type: "PDF" },
    { title: "Department Comparison", size: "1.8 MB", date: "Last week", type: "CSV" },
  ];
  return (
    <div className="space-y-2.5">
      {reports.map((r, i) => (
        <motion.div
          key={r.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3.5 bg-scale-50 rounded-xl px-4 py-3.5 border border-scale-line hover:border-scale-300 hover:shadow-scale-card transition-all duration-300 ease-expo cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0 bg-scale-50 border border-scale-line text-scale-ink-muted group-hover:bg-scale-900 group-hover:text-scale-500 group-hover:border-scale-900 transition-all duration-300">
            {r.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-scale-ink font-semibold text-sm truncate">{r.title}</p>
            <p className="text-scale-ink-faint text-[11px]">{r.size} · {r.date}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-scale-ink-faint group-hover:text-scale-600 transition-colors shrink-0">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

const tabContent: Record<string, React.ReactNode> = {
  analytics: <AnalyticsView />,
  tracking: <TrackingView />,
  reports: <ReportsView />,
};

export default function ProductShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState("analytics");

  // Scroll-linked 3D tilt — the dashboard window leans back like it's lying
  // flat on a table as it enters, then rises upright to face the viewer.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const windowRotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);

  return (
    <section ref={ref} id="product" className="relative bg-scale-50 ui-section border-t border-scale-line overflow-hidden">
      {/* Faint lime wash behind the window */}
      <div className="absolute inset-x-0 top-1/4 h-[520px] bg-scale-glow blur-2xl pointer-events-none" />

      <div className="relative ui-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="scale-eyebrow mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Live Product
          </div>
          <RevealHeading className="ui-section-title mb-4">
            See it <span className="scale-mark">in action</span>
          </RevealHeading>
          <p className="ui-lede">
            A real-time intelligence layer for every stakeholder — beautifully surfaced in one unified workspace.
          </p>
        </motion.div>

        {/* Dashboard window */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ rotateX: windowRotateX, transformPerspective: 1500 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative bg-white border border-scale-line rounded-2xl overflow-hidden shadow-scale-illustration">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-scale-line bg-scale-50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-scale-line" />
                <div className="w-3 h-3 rounded-full bg-scale-line" />
                <div className="w-3 h-3 rounded-full bg-scale-400" />
              </div>
              <div className="flex-1 h-7 bg-white border border-scale-line rounded-lg mx-4 flex items-center px-3 min-w-0">
                <span className="relative flex w-2 h-2 mr-2 shrink-0">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-scale-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-scale-500" />
                </span>
                <span className="text-scale-ink-faint text-[11px] font-mono truncate">app.upscaler-ai.com/dashboard</span>
              </div>
              <div className="hidden sm:flex gap-2">
                {["Share","Export"].map((btn) => (
                  <button key={btn} className="text-[11px] font-semibold text-scale-ink-muted hover:text-scale-ink hover:border-scale-900 transition-colors px-2.5 py-1 rounded-md bg-white border border-scale-line">
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex h-[480px]">
              {/* Sidebar */}
              <div className="hidden sm:flex w-48 border-r border-scale-line p-3 flex-col gap-1 bg-scale-50 shrink-0">
                {[
                  { label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
                  { label: "Students", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
                  { label: "Tests", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
                  { label: "Reports", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
                  { label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] transition-colors duration-200 ${
                      i === 0
                        ? "bg-white border border-scale-line text-scale-ink font-semibold shadow-scale-card"
                        : "text-scale-ink-muted hover:text-scale-ink hover:bg-white/70 border border-transparent"
                    }`}
                  >
                    {i === 0 && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-scale-gradient" />
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d={item.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-5 overflow-y-auto bg-scale-50">
                {/* Tab bar */}
                <div className="flex gap-1 bg-white border border-scale-line p-1 rounded-xl mb-5 w-fit">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${
                        activeTab === tab.id ? "text-white" : "text-scale-ink-muted hover:text-scale-ink"
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.span
                          layoutId="showcaseTab"
                          className="absolute inset-0 bg-scale-900 rounded-lg -z-10"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                        />
                      )}
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {tabContent[activeTab]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
