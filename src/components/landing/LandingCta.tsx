"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { RevealHeading } from "./RevealHeading";
import { MagneticButton } from "./MagneticButton";

export default function LandingCta() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative bg-scale-50 ui-section border-t border-scale-line overflow-hidden">
      {/* Concentric rings — quiet, in lime, behind everything */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-scale-300/40 animate-spin-slow pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-scale-300/40 animate-spin-slow pointer-events-none"
        style={{ animationDirection: "reverse", animationDuration: "34s" }}
      />
      <div className="absolute inset-0 bg-scale-glow blur-2xl pointer-events-none" />

      {/* Uses the shared ui-container for outer alignment (same edges as
          every other section), with an inner max-w-3xl purely to keep this
          block's text/buttons at a comfortable reading width — no more
          hardcoded, independent padding values that could drift out of
          sync with the rest of the page. */}
      <div className="relative z-10 ui-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="scale-eyebrow mb-8">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-scale-400 opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-scale-500" />
            </span>
            Join 1000+ learners already on UpScaler AI
          </div>

          <RevealHeading
            as="h2"
            className="font-extrabold text-scale-ink tracking-tight leading-[1.05] text-4xl sm:text-5xl lg:text-6xl mb-6"
          >
            Ready to get <span className="scale-mark">hired</span>?
          </RevealHeading>
          <p className="text-scale-ink-muted text-lg leading-relaxed mb-11 max-w-xl mx-auto">
            Start your free trial today. No credit card required.
            Full platform access for 14 days — no strings attached.
          </p>

          {/* CTA buttons — pill-shaped, dark-forest primary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-12">
            <MagneticButton className="w-full sm:w-auto">
              <Link href="/learner?mode=signup" className="scale-btn-primary !py-4 !text-base w-full sm:w-auto justify-center">
                Start Free Trial
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25} className="w-full sm:w-auto">
              <Link href="/institutional" className="scale-btn-secondary !py-4 !text-base w-full sm:w-auto justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Institution Login
              </Link>
            </MagneticButton>
          </div>

          {/* Trust note */}
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-scale-ink-faint text-[13px] pt-8 border-t border-scale-line">
            {[
              { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "SOC-2 Compliant" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "No Credit Card" },
              { icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z", label: "24/7 Support" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-scale-500">
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
