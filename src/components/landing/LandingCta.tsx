"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

export default function LandingCta() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-jet-dark py-24 lg:py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative">
        {/* Glow blob */}
        <div className="absolute inset-0 bg-cta-glow blur-3xl opacity-50 pointer-events-none" />

        {/* Animated ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-forest-DEFAULT/10 animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-forest-500/10 animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-DEFAULT/20 border border-forest-500/30 text-forest-100 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Join 1000+ learners already on BUDDIES
          </div>

          <h2 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Ready to get{" "}
            <span className="text-transparent bg-clip-text bg-green-gradient">hired</span>?
          </h2>
          <p className="text-white/50 text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Start your free trial today. No credit card required.
            Full platform access for 14 days — no strings attached.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/learner?mode=signup"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-lg bg-green-gradient shadow-green-glow hover:shadow-green-glow transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] overflow-hidden animate-glow-pulse"
            >
              <span className="relative z-10">Start Free Trial</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative z-10 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/institutional"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-white/80 text-base border border-white/15 hover:border-forest-500/50 hover:text-white hover:bg-forest-DEFAULT/10 transition-all duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Institution Login
            </Link>
          </div>

          {/* Trust note */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
            {[
              { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "SOC-2 Compliant" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "No Credit Card" },
              { icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z", label: "24/7 Support" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d={item.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
