"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, SquaresFour } from "@phosphor-icons/react";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MagneticButton } from "./MagneticButton";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { ...entrance, delay },
});

function InstitutionPreview() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none">
      {/* Double-bezel: outer shell (tray) + inner core (glass), concentric radii */}
      <div className="rounded-[2rem] bg-ink/[0.04] ring-1 ring-ink/5 p-2">
        <Card className="p-0 overflow-hidden rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-[var(--color-sidebar)]">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 h-6 rounded-md bg-white border border-line flex items-center px-2.5 min-w-0">
              <span className="text-caption font-mono truncate">app.upscaler.edu/dashboard</span>
            </div>
          </div>

          {/* Placeholder */}
          <div className="h-[420px] flex flex-col items-center justify-center gap-3 bg-[var(--color-sidebar)]">
            <div className="flex size-12 items-center justify-center rounded-lg bg-white border border-line text-ink-faint">
              <SquaresFour className="size-5" />
            </div>
            <p className="text-caption text-ink-faint">Product preview coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LandingHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      id="main-content"
      className="relative min-h-screen bg-white flex items-center overflow-hidden pt-16"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: "var(--background-image-hero-mesh)" }}
      />

      <div className="relative z-10 ui-container w-full py-20 lg:py-24">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-14 xl:gap-20 items-center">
          {/* Left: copy */}
          <div>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-heading-xl lg:text-[52px] mb-6"
            >
              Manage your entire institution from <span className="text-primary">one intelligent platform</span>
            </motion.h1>

            <motion.p {...fadeUp(0.1)} className="text-body text-ink-muted mb-9 max-w-xl">
              HR teams handle workforce operations, students track their academic journey, faculty
              manage classes and grading, and administrators oversee every department, all connected
              in one system, so information never has to be re-entered or chased down twice.
            </motion.p>

            <motion.div {...fadeUp(0.15)} className="flex flex-wrap gap-3">
              <MagneticButton strength={0.2}>
                <Link href="#contact">
                  <Button size="lg" shape="pill" className="group pr-2">
                    Request Demo
                    <ButtonIconChip>
                      <ArrowRight className="size-3.5" />
                    </ButtonIconChip>
                  </Button>
                </Link>
              </MagneticButton>
              <Link href="#platform">
                <Button variant="secondary" size="lg" shape="pill">
                  Explore Platform
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right: product preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <InstitutionPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
