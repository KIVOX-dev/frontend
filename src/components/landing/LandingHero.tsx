"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { AuthMountains } from "@/components/layout/AuthMountains";
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
            {/* Blue backdrop card, offset behind the photo for a stacked/layered look */}
            <div
              className="absolute inset-0 translate-x-8 translate-y-8 rounded-[2rem] bg-primary xl:translate-x-12 xl:translate-y-12"
              aria-hidden="true"
            />

            <div className="relative rounded-[2rem] bg-white p-2 shadow-xl ring-1 ring-ink/5">
              <div className="relative aspect-video overflow-hidden rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                {audience.heroSeason ? (
                  <AuthMountains season={audience.heroSeason} className="absolute inset-0 size-full" />
                ) : (
                  <Image
                    src={audience.photo.src}
                    alt={audience.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>

            {audience.photo.badges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: i === 0 ? -8 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...entrance, delay: 0.25 + i * 0.1 }}
                className={`absolute z-10 flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-dropdown ${
                  i === 0 ? "-top-4 -right-4 xl:-right-8" : "-bottom-4 -left-4 xl:-left-8"
                }`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <badge.icon className="size-4" weight="bold" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-ink whitespace-nowrap">{badge.label}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                    {badge.caption}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
