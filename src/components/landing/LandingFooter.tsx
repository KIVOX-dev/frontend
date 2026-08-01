"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#process" },
    { label: "FAQ", href: "#faq" },
  ],
  Portals: [
    { label: "Student Login", href: "/learner" },
    { label: "Register Free", href: "/learner?mode=signup" },
    { label: "HR / Recruiter", href: "/hr" },
    { label: "Institution", href: "/institutional" },
  ],
  Company: [
    { label: "Contact Us", href: "#contact" },
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
    <footer className="bg-scale-50 border-t border-scale-line">
      <div className="ui-container pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <Logo variant="mark" height={28} />
              <span className="text-scale-ink font-extrabold text-lg tracking-tight">UpScaler</span>
            </div>
            <p className="text-scale-ink-muted text-sm leading-relaxed mb-6 max-w-[240px]">
              Advanced AI ecosystem for aptitude training and campus-to-corporate placement readiness.
            </p>
            {/* Socials */}
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white border border-scale-line flex items-center justify-center text-scale-ink-muted hover:text-scale-500 hover:bg-scale-900 hover:border-scale-900 transition-all duration-300 ease-expo"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-scale-ink text-[11px] font-extrabold uppercase tracking-looser mb-5">
                {category}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-scale-ink-muted text-sm hover:text-scale-ink transition-colors duration-200"
                    >
                      <span className="h-px w-0 bg-scale-500 transition-all duration-300 ease-expo group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-scale-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-scale-ink-faint text-[13px]">
            © 2026 UpScaler. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-scale-400 opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-scale-500" />
            </span>
            <span className="text-scale-ink-faint text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
