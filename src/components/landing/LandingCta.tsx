"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, SignIn, ShieldCheck, CurrencyCircleDollar, Headset } from "@phosphor-icons/react";
import { RevealHeading } from "./RevealHeading";
import { MagneticButton } from "./MagneticButton";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const trustPoints = [
  { icon: ShieldCheck, label: "Enterprise-Grade Security" },
  { icon: CurrencyCircleDollar, label: "No Setup Fees" },
  { icon: Headset, label: "24/7 Support" },
];

export default function LandingCta() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative bg-[var(--color-bg-secondary)] ui-section border-t border-line overflow-hidden">
      {/* Concentric rings — quiet, in green, behind everything */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-primary/15 animate-spin-slow pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-primary/15 animate-spin-slow pointer-events-none"
        style={{ animationDirection: "reverse", animationDuration: "34s" }}
      />
      <div className="absolute inset-0 bg-[image:var(--background-image-cta-glow)] blur-2xl pointer-events-none" />

      {/* Uses the shared ui-container for outer alignment (same edges as
          every other section), with an inner max-w-3xl purely to keep this
          block's text/buttons at a comfortable reading width. */}
      <div className="relative z-10 ui-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <Badge tone="success" className="mb-8">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            Trusted by 500+ institutions
          </Badge>

          <RevealHeading
            as="h2"
            className="font-extrabold text-ink tracking-tight leading-[1.05] text-4xl sm:text-5xl lg:text-6xl mb-6"
          >
            Ready to <span className="ui-mark">transform</span> your institution?
          </RevealHeading>
          <p className="text-ink-muted text-lg leading-relaxed mb-11 max-w-xl mx-auto">
            See how HR, students, faculty, and administrators can all work from one connected
            platform. Book a personalized demo with our team.
          </p>

          {/* CTA buttons — pill-shaped, nested trailing-icon chip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-12">
            <MagneticButton className="w-full sm:w-auto">
              <Link href="#contact">
                <Button size="lg" shape="pill" className="group w-full pr-2 sm:w-auto justify-center">
                  Request Demo
                  <ButtonIconChip>
                    <ArrowRight className="size-3.5" />
                  </ButtonIconChip>
                </Button>
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25} className="w-full sm:w-auto">
              <Link href="/institutional">
                <Button variant="secondary" size="lg" shape="pill" className="w-full sm:w-auto justify-center">
                  <SignIn className="size-[18px]" />
                  Institution Login
                </Button>
              </Link>
            </MagneticButton>
          </div>

          {/* Trust note */}
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-ink-faint text-[13px] pt-8 border-t border-line">
            {trustPoints.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="size-3.5 text-primary" />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
