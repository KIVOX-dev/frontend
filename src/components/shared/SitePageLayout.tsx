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
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
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
  /** Highlights this page in the menu; omit for pages that aren't listed there. */
  active?: PageSlug;
  /** Section headings for the right-hand "On this page" nav. Each id must
      match an `id` on the corresponding <h2> in `children`. */
  toc?: TocEntry[];
  children: ReactNode;
}) {
  const activeGroup = NAV_GROUPS.find((g) => g.items.some((i) => i.slug === active));
  const activeTocId = useScrollSpy(toc);

  return (
    // Same chrome, type scale and colours as DocsShell (/docs/...), so moving
    // between these pages and the docs feels like one site.
    <div className={`${campusFonts} min-h-screen bg-white text-[#44585A] [font-family:var(--font-tsl-sans)] antialiased`}>
      <header className="sticky top-0 z-40 border-b border-[#E9EEEE] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[#06262B]" aria-label="TalentSnaps home">
            <Image src="/brand/lockup.png" alt="TalentSnaps: skill meets opportunities" width={1400} height={308} sizes="200px" priority className="h-[40px] w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <a href="mailto:admin@talentsnaps.com" className="hidden px-3 text-[16px] text-[#06262B] hover:text-[#0563F9] sm:inline">
              Support
            </a>
            <Link
              href="/"
              className="group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-[4px] border-[1.5px] border-[#06262B] bg-[#06262B] px-4 py-2.5 text-[15px] font-semibold leading-none text-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0563F9]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 translate-y-[101%] bg-[#0563F9] transition-transform duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0"
              />
              <svg viewBox="0 0 16 16" fill="none" className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true">
                <path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to landing page
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 sm:px-8 lg:flex-row lg:gap-10 xl:gap-14">
        <aside className="w-full shrink-0 pt-8 lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:w-64 lg:overflow-y-auto lg:py-10">
          <nav aria-label="Site pages" className="flex flex-col gap-7">
            {NAV_GROUPS.map((group) => (
              <div key={group.head}>
                <p className="mb-2 px-3 text-[13px] font-semibold uppercase tracking-[.06em] text-[#6E7E7F]">{group.head}</p>
                <ul className="flex flex-row flex-wrap gap-0.5 lg:flex-col">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        aria-current={item.slug === active ? "page" : undefined}
                        className={`block whitespace-nowrap rounded-md px-3 py-2 text-[16px] transition-colors ${
                          item.slug === active
                            ? "bg-[#EDF1F1] font-semibold text-[#06262B]"
                            : "text-[#44585A] hover:bg-[#F5F7F7] hover:text-[#06262B]"
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
        </aside>

        <main className="min-w-0 flex-1 pb-12 lg:py-12">
          <article className="max-w-[820px] text-[17px] leading-[1.75]">
            {(eyebrow ?? activeGroup?.head) && (
              <span className="mb-3 block text-[13px] font-semibold uppercase tracking-[.06em] text-[#0563F9]">
                {eyebrow ?? activeGroup?.head}
              </span>
            )}
            <h1 className="text-[clamp(32px,4vw,46px)] font-semibold leading-tight tracking-[-0.02em] text-[#06262B]">{title}</h1>
            {updated && <p className="mt-6 text-[#44585A]">Last updated: {updated}</p>}

            <div
              className={`mt-6
                [&_section]:mt-12 [&_section:first-child]:mt-0
                [&_h2]:mb-2 [&_h2]:scroll-mt-28 [&_h2]:text-[clamp(24px,2.6vw,30px)] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:tracking-[-0.01em] [&_h2]:text-[#06262B]
                [&_h3]:mb-1 [&_h3]:mt-9 [&_h3]:scroll-mt-28 [&_h3]:text-[clamp(19px,2vw,23px)] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-[#06262B]
                [&_p]:my-4
                [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-[#6E7E7F]
                [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:marker:text-[#6E7E7F]
                [&_li]:pl-1
                [&_strong]:font-semibold [&_strong]:text-[#06262B]
                [&_a]:font-medium [&_a]:text-[#0563F9] [&_a:hover]:underline`}
            >
              {children}
            </div>
          </article>
        </main>

        {toc && toc.length > 0 && (
          <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-72 shrink-0 overflow-y-auto py-12 xl:block">
            <p className="mb-3 flex items-center gap-2 text-[16px] font-medium text-[#06262B]">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h12M4 18h8" />
              </svg>
              On this page
            </p>
            <ul className="flex flex-col gap-0.5 border-l border-[#E3E8E8] text-[15.5px]">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`-ml-px block border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                      activeTocId === t.id ? "border-[#0563F9] text-[#06262B]" : "border-transparent text-[#44585A] hover:text-[#06262B]"
                    }`}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
