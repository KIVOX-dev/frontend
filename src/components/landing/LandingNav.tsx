"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Process", href: "#process" },
  { label: "Testimonials", href: "#trust" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-jet/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/buddies-logo.jpg" alt="BUDDIES" style={{ height: "36px", width: "auto", borderRadius: "8px", objectFit: "contain" }} />
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-forest-100 transition-colors">
              BUDDIES
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-brand group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            <Link href="/hr" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">
              HR Portal
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/learner"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/learner?mode=signup"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-gradient border border-forest-500/30 shadow-green-glow-sm hover:shadow-green-glow transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] overflow-hidden group"
            >
              <span className="relative z-10">Start Free Trial</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[9px]" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden bg-jet/98 backdrop-blur-xl border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/70 hover:text-white font-medium py-1 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link href="/hr" className="text-white/70 hover:text-white font-medium py-1 transition-colors" onClick={() => setMenuOpen(false)}>HR Portal</Link>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <Link href="/learner" className="text-center py-2.5 rounded-xl text-white/70 hover:text-white font-medium transition-colors" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/learner?mode=signup" className="text-center py-2.5 rounded-xl font-semibold text-white bg-green-gradient shadow-green-glow-sm" onClick={() => setMenuOpen(false)}>Start Free Trial</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
