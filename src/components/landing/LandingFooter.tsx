"use client";

import Link from "next/link";
import { GithubLogo, LinkedinLogo, TwitterLogo } from "@phosphor-icons/react";
import { Logo } from "@/components/shared/Logo";

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
    { label: "Blog", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "API Docs", href: "#" },
  ],
  Company: [
    { label: "Contact Us", href: "#contact" },
    { label: "Careers", href: "#" },
    { label: "About Us", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

const socials = [
  { label: "Twitter", href: "#", Icon: TwitterLogo },
  { label: "LinkedIn", href: "#", Icon: LinkedinLogo },
  { label: "GitHub", href: "#", Icon: GithubLogo },
];

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
            {/* Socials */}
            <div className="flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white border border-line flex items-center justify-center text-ink-muted hover:text-white hover:bg-ink hover:border-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
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
            © 2026 UpScaler. All rights reserved.
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
