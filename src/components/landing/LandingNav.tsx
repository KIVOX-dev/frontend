"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, ArrowRight, CaretDown, GraduationCap, Briefcase, Buildings, ShieldCheck } from "@phosphor-icons/react";
import { ResponsiveLogo } from "@/components/shared/Logo";
import { Button, ButtonIconChip } from "@/components/ui/Button";
import { AUDIENCES, type AudienceKey } from "./audiences";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Features", href: "#features" },
  { label: "Resources", href: "#resources" },
  { label: "Contact", href: "#contact" },
];

// The root ("/") page is the TalentSnaps redesign, whose sections carry
// their own ts- prefixed ids (see TalentSnapsLanding.tsx) rather than the
// #platform/#solutions/... placeholders above.
const learnerNavLinks = [
  { label: "Modules", href: "#ts-modules" },
  { label: "Skill Report", href: "#ts-report" },
  { label: "Data", href: "#ts-data" },
  { label: "FAQ", href: "#ts-faq" },
];

// The 4 real top-level login audiences — Faculty isn't a separate one, it
// logs in through the Institution hub alongside Admin and Student.
const loginRoles = [
  { label: "Student", href: "/learner", icon: GraduationCap },
  { label: "HR Team", href: "/hr", icon: Briefcase },
  { label: "Institution (Admin & Faculty)", href: "/institutional", icon: Buildings },
  { label: "Super Admin", href: "/superadmin", icon: ShieldCheck },
];

export default function LandingNav({ audience: audienceKey }: { audience: AudienceKey }) {
  const audience = AUDIENCES[audienceKey];
  const activeNavLinks = audienceKey === "learner" ? learnerNavLinks : navLinks;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loginOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [loginOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy — only highlights sections that actually exist on the page
  // yet; harmless no-op for links whose section hasn't been built in this
  // rebuild phase.
  useEffect(() => {
    const sections = activeNavLinks
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-colors duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "border-b border-line-soft"
      }`}
    >
      <div className="ui-container">
        <div className="flex items-center justify-between h-32">
          <Link href={audience.path} className="flex items-center gap-2 shrink-0">
            <ResponsiveLogo height={112} priority />
            {audience.navSuffix && (
              <span className="hidden sm:inline text-lg text-ink-muted font-medium">{audience.navSuffix}</span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {activeNavLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full bg-primary" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative" ref={loginRef}>
              <Button
                variant="ghost"
                size="sm"
                shape="pill"
                onClick={() => setLoginOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={loginOpen}
                className="group rounded-none"
              >
                Log In
                <CaretDown className={`size-3.5 transition-transform duration-200 ${loginOpen ? "rotate-180" : ""}`} />
              </Button>

              <AnimatePresence>
                {loginOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-lg border border-line bg-white p-1.5 shadow-dropdown"
                  >
                    {loginRoles.map((role) => (
                      <Link
                        key={role.label}
                        href={role.href}
                        role="menuitem"
                        onClick={() => setLoginOpen(false)}
                        className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-paper-tint hover:text-ink transition-colors duration-150"
                      >
                        <role.icon className="size-4 text-primary shrink-0" />
                        {role.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="#contact">
              <Button size="sm" shape="pill" className="group pr-1.5 rounded-none">
                {audience.navCtaLabel}
                <ButtonIconChip className="size-5 rounded-none">
                  <ArrowRight className="size-3" />
                </ButtonIconChip>
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-ink hover:bg-paper-tint transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <List className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-line overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {activeNavLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-ink-muted hover:text-ink font-medium py-2.5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 mt-2 border-t border-line flex flex-col gap-1">
                <p className="text-ink-faint text-[11px] font-extrabold uppercase tracking-looser px-1 mb-1">
                  Log In
                </p>
                {loginRoles.map((role) => (
                  <Link
                    key={role.label}
                    href={role.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-ink-muted hover:text-ink hover:bg-paper-tint font-medium transition-colors"
                  >
                    <role.icon className="size-4 text-primary shrink-0" />
                    {role.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 mt-2 border-t border-line flex flex-col gap-2">
                <Link href="#contact" onClick={() => setMenuOpen(false)}>
                  <Button shape="pill" className="w-full justify-center rounded-none">
                    {audience.navCtaLabel}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
