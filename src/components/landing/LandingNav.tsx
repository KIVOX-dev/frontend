"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, ArrowRight } from "@phosphor-icons/react";
import { ResponsiveLogo } from "@/components/shared/Logo";
import { Button, ButtonIconChip } from "@/components/ui/Button";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Features", href: "#features" },
  { label: "Resources", href: "#resources" },
  { label: "Contact", href: "#contact" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy — only highlights sections that actually exist on the page
  // yet; harmless no-op for links whose section hasn't been built in this
  // rebuild phase.
  useEffect(() => {
    const sections = navLinks
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
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="ui-container">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link href="/" className="flex items-center shrink-0">
            <ResponsiveLogo height={40} priority />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
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
            <Link href="/learner">
              <Button variant="ghost" size="sm" shape="pill">
                Login
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="sm" shape="pill" className="group pr-1.5">
                Request Demo
                <ButtonIconChip className="size-5">
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
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-ink-muted hover:text-ink font-medium py-2.5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 mt-2 border-t border-line flex flex-col gap-2">
                <Link href="/learner" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" shape="pill" className="w-full justify-center">
                    Login
                  </Button>
                </Link>
                <Link href="#contact" onClick={() => setMenuOpen(false)}>
                  <Button shape="pill" className="w-full justify-center">
                    Request Demo
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
