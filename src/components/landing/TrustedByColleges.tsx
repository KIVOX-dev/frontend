"use client";

import { partnerColleges } from "@/lib/partnerColleges";

// Rendered twice back-to-back so the `animate-marquee` keyframe (defined in
// globals.css, translateX 0% -> -50%) loops seamlessly with no visible seam.
const logos = [...partnerColleges, ...partnerColleges];

export default function TrustedByColleges() {
  return (
    <section className="bg-[var(--color-sidebar)] border-t border-line py-10 overflow-hidden">
      <p className="text-center text-caption font-semibold uppercase tracking-wide text-ink-faint mb-7">
        Trusted by colleges across Coimbatore
      </p>

      <div className="group relative">
        <div className="flex w-max items-center gap-4 px-4 animate-marquee group-hover:[animation-play-state:paused]">
          {logos.map((college, i) => (
            <div
              key={`${college.code}-${i}`}
              title={college.name}
              className="flex h-20 w-64 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white px-6 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
            >
              {/* Logos are sourced from each college's own site at wildly
                  inconsistent aspect ratios — from square crests to ~7:1
                  full-name banners — so a plain <img> with object-contain
                  scales all of them uniformly, which next/image's fixed
                  width/height model fights. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={college.logo}
                alt={college.name}
                className="max-h-14 max-w-[200px] w-auto object-contain"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--color-sidebar)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--color-sidebar)] to-transparent" />
      </div>
    </section>
  );
}
