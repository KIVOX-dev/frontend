"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { LandscapeArt } from "@/components/landing/talentsnaps/MountainScene";
import { RevealHeading } from "./RevealHeading";
import { MagneticButton } from "./MagneticButton";
import { AUDIENCES, type AudienceKey } from "./audiences";

const entrance = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

// Fixed positions + fixed fall timing (not Math.random()) so server and
// client render identical markup — same reasoning as the login screens'
// snowfall/rain (see AuthMountains.tsx).
const HERO_RAIN = [
  { left: 4, duration: 0.9, delay: -0.1 }, { left: 11, duration: 1.1, delay: -0.6 },
  { left: 18, duration: 0.8, delay: -0.3 }, { left: 25, duration: 1.2, delay: -0.8 },
  { left: 32, duration: 0.95, delay: -0.2 }, { left: 39, duration: 1.05, delay: -0.5 },
  { left: 46, duration: 0.85, delay: -0.4 }, { left: 53, duration: 1.15, delay: -0.15 },
  { left: 60, duration: 0.9, delay: -0.65 }, { left: 67, duration: 1, delay: -0.35 },
  { left: 74, duration: 0.8, delay: -0.05 }, { left: 81, duration: 1.1, delay: -0.7 },
  { left: 88, duration: 0.95, delay: -0.25 }, { left: 95, duration: 1.05, delay: -0.5 },
];

// A dark, low storm-cloud wash plus falling rain, layered over the same
// detailed mountain scene the root landing page uses — monsoon atmosphere
// on the same art, rather than a smaller, plainer scene that reads as
// generic rolling hills once cropped into a wide hero card.
function MonsoonOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(31,44,42,.55), rgba(31,44,42,.12) 45%, transparent 72%)" }}
      />
      {HERO_RAIN.map((r, i) => (
        <span
          key={i}
          className="hero-rain-streak"
          style={{ left: `${r.left}%`, animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s` }}
        />
      ))}
      <style jsx>{`
        .hero-rain-streak {
          position: absolute;
          top: -10%;
          width: 2px;
          height: 7%;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.6));
          transform: rotate(10deg);
          animation-name: hero-rain-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes hero-rain-fall {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.7; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function LandingHero({ audience: audienceKey }: { audience: AudienceKey }) {
  const reduceMotion = useReducedMotion();
  const audience = AUDIENCES[audienceKey];

  if (audience.heroMonsoon) {
    return (
      <>
        {/* Centered text hero on a plain background — matches the root
            landing page's own Hero() pattern, not a copy+photo split. */}
        <section id="main-content" className="relative bg-white overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ backgroundImage: "var(--background-image-hero-mesh)" }}
          />
          <div className="relative z-10 ui-container w-full py-20 lg:py-28 flex flex-col items-center text-center">
            {audience.heroChip && (
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={entrance}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 mb-6"
              >
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {audience.heroChip}
              </motion.span>
            )}

            <RevealHeading as="h1" delay={0.08} className="text-heading-xl lg:text-[52px] max-w-3xl mb-6">
              {audience.headline}
            </RevealHeading>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...entrance, delay: 0.18 }}
              className="text-body text-ink-muted max-w-xl mb-8"
            >
              {audience.description}
            </motion.p>

            <motion.ul
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...entrance, delay: 0.24 }}
              className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 mb-9"
            >
              {audience.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-body text-ink">
                  <Check className="size-4 text-primary shrink-0" weight="bold" />
                  {b}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...entrance, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3"
            >
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
            </motion.div>
          </div>
        </section>

        {/* Full-bleed mountain scenery — no card, no photo, matching the
            root page's separate HeroScene band beneath its own Hero(). */}
        <section className="relative overflow-hidden">
          <div className="relative h-[380px] lg:h-[480px]">
            <LandscapeArt className="absolute inset-0 block w-full h-full" />
            <MonsoonOverlay />

            {audience.photo.badges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: i === 0 ? -8 : 8 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ ...entrance, delay: 0.15 + i * 0.1 }}
                className={`absolute z-10 flex items-center gap-2.5 rounded-2xl border border-line bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-dropdown ${
                  i === 0 ? "top-8 right-6 lg:right-16" : "bottom-8 left-6 lg:left-16"
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
        </section>
      </>
    );
  }

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
