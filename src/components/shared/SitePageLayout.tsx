"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { campusFonts } from "@/components/landing/campus/fonts";

const NAV_GROUPS = [
  {
    head: "Product",
    items: [
      { slug: "verification", label: "Verification" },
      { slug: "profile-setup", label: "Profile Setup" },
      { slug: "changelog", label: "Changelog" },
    ],
  },
  {
    head: "Company",
    items: [
      { slug: "about-us", label: "About Us" },
      { slug: "partner-colleges", label: "Partner Colleges" },
      { slug: "careers", label: "Careers" },
    ],
  },
  {
    head: "Legal",
    items: [
      { slug: "docs/individuals/privacy-policy", label: "Privacy Policy" },
      { slug: "docs/individuals/terms-and-conditions", label: "Terms and Conditions" },
      { slug: "docs/individuals/cookie-policy", label: "Cookie Policy" },
      { slug: "docs/individuals/data-protection", label: "Data Protection" },
    ],
  },
] as const;

type PageSlug = (typeof NAV_GROUPS)[number]["items"][number]["slug"];
export type TocEntry = { id: string; label: string };

// Highlights whichever section heading is currently under the top of the
// viewport as the reader scrolls — the classic docs-site "On this page"
// behaviour, driven off the same ids the content's own <h2 id="..."> tags
// carry (see each page's `toc` prop).
function useScrollSpy(toc: readonly TocEntry[] | undefined) {
  const [activeId, setActiveId] = useState<string | null>(toc?.[0]?.id ?? null);

  useEffect(() => {
    if (!toc || toc.length === 0) return;
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  return activeId;
}

export function SitePageLayout({
  title,
  eyebrow,
  updated,
  active,
  toc,
  children,
}: {
  title: string;
  /** Small label above the title — defaults to whichever group `active` is in. */
  eyebrow?: string;
  /** Only the three legal pages carry a revision date. */
  updated?: string;
  /** Which of the six pages this is, so the sidebar can link the other
      five and highlight the current one — one connected nav across
      Company and Legal, instead of two separate page systems. */
  active: PageSlug;
  /** Section headings for the right-hand "On this page" nav. Each id must
      match an `id` on the corresponding <h2> in `children`. */
  toc?: TocEntry[];
  children: ReactNode;
}) {
  const activeGroup = NAV_GROUPS.find((g) => g.items.some((i) => i.slug === active));
  const activeTocId = useScrollSpy(toc);

  return (
    <main className={`bg-paper min-h-screen font-jakarta antialiased ${campusFonts}`}>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-line-soft">
        <div className="ui-container flex items-center justify-between h-16">
          {/* Same logo lockup and button as the landing nav (campus.css
              .logo / .btn.btn-dark), so moving between them feels like one site. */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 text-[#06262B]" aria-label="TalentSnaps home">
            <Image src="/images/landing/logo-mark.png" alt="" width={36} height={36} className="rounded-full" priority />
            <span className="text-2xl leading-none font-light tracking-[-0.01em] [font-family:var(--font-tsl-brand)]">
              <b className="font-semibold">Talent</b>Snaps
            </span>
          </Link>
          <Link
            href="/"
            className="group relative isolate inline-flex items-center gap-2.5 overflow-hidden rounded-[4px] border-[1.5px] border-[#06262B] bg-[#06262B] px-5 py-3 text-[15px] font-semibold leading-none text-white [font-family:var(--font-tsl-sans)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0563F9]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 translate-y-[101%] bg-[#0563F9] transition-transform duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0"
            />
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true">
              <path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to landing page
          </Link>
        </div>
      </header>

      <div className="ui-container flex flex-col lg:flex-row gap-10 lg:gap-12 py-10 lg:py-14 items-start">
        <nav className="w-full lg:w-52 shrink-0 lg:sticky lg:top-24 flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.head}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-3 px-3">{group.head}</p>
              <ul className="flex flex-row lg:flex-col gap-1 flex-wrap">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/${item.slug}`}
                      aria-current={item.slug === active ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        item.slug === active
                          ? "bg-paper-tint text-ink"
                          : "text-ink-muted hover:text-ink hover:bg-paper-tint"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <article className="max-w-[680px] w-full">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3 block">
            {eyebrow ?? activeGroup?.head}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-2">{title}</h1>
          {updated && <p className="text-sm text-ink-faint mb-10">Last updated {updated}</p>}

          <div
            className={`space-y-8 text-[15px] leading-relaxed text-ink-soft ${updated ? "" : "mt-10"}
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:scroll-mt-24
              [&_p]:mb-3 [&_p:last-child]:mb-0
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
              [&_a]:text-primary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2`}
          >
            {children}
          </div>
        </article>

        {toc && toc.length > 0 && (
          <nav className="hidden xl:block w-56 shrink-0 sticky top-24">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-3 px-3">
              <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
                <path d="M2.5 4h11M2.5 8h11M2.5 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              On this page
            </p>
            <ul className="flex flex-col gap-0.5 border-l border-line-soft">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`block pl-3.5 -ml-px py-1.5 text-[13px] border-l-2 transition-colors ${
                      activeTocId === t.id
                        ? "border-primary text-ink font-semibold"
                        : "border-transparent text-ink-faint hover:text-ink-muted"
                    }`}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </main>
  );
}
