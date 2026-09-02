"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { MagneticButton } from "./MagneticButton";
import { AUDIENCES, type AudienceKey } from "./audiences";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

export default function LandingHero({ audience: audienceKey }: { audience: AudienceKey }) {
  const reduceMotion = useReducedMotion();
  const audience = AUDIENCES[audienceKey];

  return (
    <section id="main-content" className="relative bg-white overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: "var(--background-image-hero-mesh)" }}
      />

      <div className="relative z-10 ui-container w-full py-16 lg:py-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={entrance}
          className="grid lg:grid-cols-[3fr_2fr] gap-14 xl:gap-20 items-center"
        >
          {/* Left: copy */}
          <div>
            <h1 className="text-heading-xl lg:text-[52px] mb-6">{audience.headline}</h1>

            <p className="text-body text-ink-muted mb-7 max-w-xl">{audience.description}</p>

            <ul className="flex flex-col gap-2.5 mb-9">
              {audience.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-body text-ink">
                  <Check className="size-4 text-primary shrink-0" weight="bold" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <MagneticButton strength={0.2}>
                <Link href={audience.href}>
                  <Button size="lg" shape="pill" className="group pr-2">
                    {audience.ctaLabel}
                    <ButtonIconChip>
                      <ArrowRight className="size-3.5" />
                    </ButtonIconChip>
                  </Button>
                </Link>
              </MagneticButton>
              <Link href={audience.href}>
                <Button variant="secondary" size="lg" shape="pill">
                  Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: real photo for this audience */}
          <div className="relative hidden lg:block">
            <div className="rounded-[2rem] bg-ink/[0.04] ring-1 ring-ink/5 p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <Image
                  src={audience.photo.src}
                  alt={audience.photo.alt}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
