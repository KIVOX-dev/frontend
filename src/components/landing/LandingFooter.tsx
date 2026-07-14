"use client";

import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#process" },
    { label: "Pricing", href: "#" },
  ],
  Portals: [
    { label: "Student Login", href: "/learner" },
    { label: "Register Free", href: "/learner?mode=signup" },
    { label: "HR / Recruiter", href: "/hr" },
    { label: "Institution", href: "/institutional" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Mission", href: "#mission" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

const socials = [
  {
    label: "Twitter",
    href: "#",
    icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
  },
  {
    label: "GitHub",
    href: "#",
    icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-jet-dark border-t border-white/[0.05]">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/buddies-logo.jpg" alt="BUDDIES" style={{ height: "36px", width: "auto", borderRadius: "8px", objectFit: "contain" }} />
              <span className="text-white font-bold text-lg tracking-tight">BUDDIES</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-[220px]">
              Advanced AI ecosystem for aptitude training and campus-to-corporate placement readiness.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-forest-DEFAULT/30 hover:border-forest-500/30 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-5">{category}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/35 text-sm hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block transition-transform"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">
            © 2026 BUDDIES. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-brand animate-pulse" />
            <span className="text-white/25 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
