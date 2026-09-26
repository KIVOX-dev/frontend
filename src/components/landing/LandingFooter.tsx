"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

// Every link here is a real route or a real in-page section id — no "#"
// placeholders. Blog/Help Center/API Docs/social accounts
// were dropped rather than left as dead links: TalentSnaps is an early-stage
// team (see /about-us) with none of those yet, and Data Protection (a real
// page) already covers what "Security" would have promised.
const footerLinks = {
  Product: [
    { label: "Platform Overview", href: "#platform" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#contact" },
  ],
  Solutions: [
    { label: "HR Team", href: "/hr" },
    { label: "Students", href: "/learner" },
    { label: "Faculty", href: "/faculty" },
    { label: "College Admin", href: "/institutional" },
  ],
  Resources: [
    { label: "FAQ", href: "#faq" },
    { label: "For Employers", href: "/for-hr" },
    { label: "For Institutions", href: "/for-institutions" },
    { label: "Partner Colleges", href: "/partner-colleges" },
    { label: "Verification", href: "/verification" },
    { label: "Profile Setup", href: "/profile-setup" },
    { label: "Changelog", href: "/changelog" },
  ],
  Company: [
    { label: "About Us", href: "/about-us" },
    { label: "Careers", href: "/careers" },
    { label: "Contact Us", href: "#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/docs/individuals/privacy-policy" },
    { label: "Terms and Conditions", href: "/docs/individuals/terms-and-conditions" },
    { label: "Cookie Policy", href: "/docs/individuals/cookie-policy" },
    { label: "Data Protection", href: "/docs/individuals/data-protection" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-[var(--color-bg-secondary)] border-t border-line">
      <div className="ui-container pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-5">
              <Logo variant="primary" height={64} />
            </div>
            <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-[240px]">
              One intelligent platform connecting HR, students, faculty, and administrators across
              your institution.
            </p>
            <a
              href="mailto:admin@talentsnaps.com"
              className="text-ink-muted text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              admin@talentsnaps.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-ink text-[11px] font-extrabold uppercase tracking-looser mb-5">
                {category}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-ink-muted text-sm hover:text-ink transition-colors duration-200"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ink-faint text-[13px]">
            © 2026 TalentSnaps. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            <span className="text-ink-faint text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
