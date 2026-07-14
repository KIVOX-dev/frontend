"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

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
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avg Score", value: "82.4", delta: "+5.2", positive: true },
          { label: "Completion", value: "91%", delta: "+12%", positive: true },
          { label: "Dropouts", value: "3.1%", delta: "-2.1%", positive: true },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.04] rounded-xl p-3.5 border border-white/[0.07]">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-white font-bold text-xl mb-1">{s.value}</p>
            <span className="text-emerald-400 text-[11px] font-semibold">{s.delta}</span>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
        <div className="flex items-end gap-1.5 h-24">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
              style={{ height: `${h}%`, originY: 1 }}
              className="flex-1 rounded-t-sm bg-green-gradient opacity-80 hover:opacity-100 transition-opacity relative group cursor-pointer"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {h}%
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {months.map((m) => (
            <span key={m} className="text-white/25 text-[8px] flex-1 text-center">{m}</span>
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
    Placed: "text-emerald-400 bg-emerald-400/10",
    Active: "text-blue-400 bg-blue-400/10",
    "Needs Help": "text-amber-400 bg-amber-400/10",
  };
  return (
    <div className="space-y-2.5">
      {students.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06] hover:border-emerald-brand/30 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-green-gradient/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
            #{s.rank}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{s.name}</p>
            <p className="text-white/40 text-[11px]">{s.dept}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-bold">{s.score}</p>
            <p className="text-white/30 text-[10px]">score</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${statusColors[s.status]}`}>
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex items-center gap-3.5 bg-white/[0.04] rounded-xl px-4 py-3.5 border border-white/[0.06] hover:border-emerald-brand/30 hover:bg-emerald-brand/5 transition-all cursor-pointer group"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${r.type === "PDF" ? "bg-red-500/15 text-red-400" : r.type === "XLSX" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"}`}>
            {r.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate group-hover:text-emerald-300 transition-colors">{r.title}</p>
            <p className="text-white/35 text-[11px]">{r.size} · {r.date}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/30 group-hover:text-emerald-400 transition-colors shrink-0">
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

  return (
    <section ref={ref} id="product" className="bg-jet-dark py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 text-sm font-medium mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/></svg>
            Live Product
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            See it{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">in action</span>
          </h2>
          <p className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed">
            A real-time intelligence layer for every stakeholder — beautifully surfaced in one unified workspace.
          </p>
        </motion.div>

        {/* Dashboard window */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glow */}
          <div className="absolute -inset-px rounded-2xl bg-green-gradient opacity-30 blur-md" />
          <div className="absolute inset-0 bg-cta-glow blur-3xl opacity-30 rounded-full scale-75" />

          {/* Window chrome */}
          <div className="relative bg-jet/95 border border-white/10 rounded-2xl overflow-hidden shadow-dark-card">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 h-6 bg-white/[0.04] rounded-md mx-4 flex items-center px-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                <span className="text-white/25 text-[11px] font-mono">app.buddies.ai/dashboard</span>
              </div>
              <div className="flex gap-2">
                {["Share","Export"].map((btn) => (
                  <button key={btn} className="text-[11px] text-white/30 hover:text-white/60 transition-colors px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.07]">{btn}</button>
                ))}
              </div>
            </div>

            <div className="flex h-[480px]">
              {/* Sidebar */}
              <div className="w-48 border-r border-white/[0.07] p-4 flex flex-col gap-1 bg-white/[0.01] shrink-0">
                {[
                  { label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
                  { label: "Students", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
                  { label: "Tests", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
                  { label: "Reports", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
                  { label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${i === 0 ? "bg-emerald-brand/20 text-emerald-300 font-semibold" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d={item.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-5 overflow-hidden">
                {/* Tab bar */}
                <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl mb-5 w-fit">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? "text-white bg-emerald-brand/30 shadow-green-glow-sm"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-emerald-brand/20 rounded-lg -z-10 border border-emerald-brand/30"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
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
