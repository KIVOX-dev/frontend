"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, X as CloseIcon, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

// Mirrors coursera.org's own homepage hero: a promo carousel (Coursera Plus
// / Coursera for Teams cards) directly under the nav — not a headline+photo
// hero like /business or /campus. Translated to our real Pro plan
// (Subscription.tsx) and institutional onboarding, not invented content.
export default function RootHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  return (
    <section ref={ref} id="main-content" className="bg-white ui-section pt-12 pb-14 lg:pt-14 lg:pb-16">
      <div className="ui-container">
        {!dismissed && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={entrance}
            className="mb-8 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#0d2f60] to-primary px-6 py-3.5"
          >
            <p className="text-sm font-semibold text-white">
              Save 20% on UpScaler Pro — unlimited practice, AI doubt solving, and advanced analytics.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/learner">
                <Button size="sm" shape="pill" variant="secondary" className="bg-white text-ink hover:bg-white/90">
                  Save now
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="text-white/70 hover:text-white transition-colors"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...entrance, delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0056d2] to-[#0d2f60] p-8 lg:p-10"
          >
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" aria-hidden="true" />
            <div className="absolute right-16 bottom-4 size-24 rounded-full bg-white/5" aria-hidden="true" />
            {/* Pink price-tag accent — Coursera's own promo cards always
                pair their blue card body with a pink/magenta price badge,
                never blue-on-blue. */}
            <span className="hidden sm:flex absolute right-7 top-7 flex-col items-center justify-center size-20 rounded-2xl rotate-6 bg-[var(--color-accent-pink-500)] text-white shadow-lg">
              <span className="text-[10px] font-bold leading-none">SAVE</span>
              <span className="text-xl font-extrabold leading-none mt-0.5">20%</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white mb-5">
              <Sparkle className="size-3.5" weight="fill" />
              UpScaler Pro
            </span>
            <h2 className="text-2xl lg:text-[28px] font-extrabold text-white leading-tight mb-3 max-w-sm">
              Unlimited practice, AI doubt solving, and placement analytics
            </h2>
            <p className="text-white/70 text-sm mb-7 max-w-xs">
              One upgrade unlocks every aptitude track, unlimited AI mock interviews, and your full readiness report.
            </p>
            <Link href="/learner">
              <Button shape="pill" className="bg-white text-ink hover:bg-white/90 group pr-2">
                Upgrade to Pro
                <ArrowRight className="size-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...entrance, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-[var(--color-sidebar)] border border-line p-8 lg:p-10"
          >
            <span className="hidden sm:flex absolute right-7 top-7 flex-col items-center justify-center size-16 rounded-full bg-[var(--color-accent-pink-500)] text-white text-center shadow-lg">
              <span className="text-[9px] font-bold leading-none">UP TO</span>
              <span className="text-base font-extrabold leading-none mt-0.5">30%</span>
              <span className="text-[8px] font-semibold leading-none mt-0.5">OFF</span>
            </span>
            <p className="text-caption font-bold uppercase tracking-wide text-primary mb-2">UpScaler for Institutions</p>
            <h2 className="text-2xl lg:text-[28px] font-extrabold text-ink leading-tight mb-3 max-w-sm">
              Onboard your whole college and run placements together
            </h2>
            <p className="text-ink-muted text-sm mb-7 max-w-xs">
              Bulk student onboarding, department-wide analytics, and placement drives run jointly with HR — see your options.
            </p>
            <Link href="/for-institutions">
              <Button variant="secondary" shape="pill" className="group pr-2">
                See institution plans
                <ArrowRight className="size-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
