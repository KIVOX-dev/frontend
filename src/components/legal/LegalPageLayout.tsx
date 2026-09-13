import type { ReactNode } from "react";
import Link from "next/link";
import { ResponsiveLogo } from "@/components/shared/Logo";

const LEGAL_PAGES = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "data-protection", label: "Data Protection" },
] as const;

type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];

export function LegalPageLayout({
  title,
  updated,
  active,
  children,
}: {
  title: string;
  updated: string;
  /** Which of the three legal pages this is, so the sidebar can link the
      other two and highlight the current one — same "connected docs"
      pattern as most SaaS legal sections, instead of three orphan pages
      only reachable from the footer. */
  active: LegalSlug;
  children: ReactNode;
}) {
  return (
    <main className="bg-paper min-h-screen font-jakarta antialiased">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-line-soft">
        <div className="ui-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <ResponsiveLogo height={32} priority />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-ink text-white text-sm font-semibold px-4 py-2 hover:bg-ink-hover transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
              <path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to landing page
          </Link>
        </div>
      </header>

      <div className="ui-container flex flex-col md:flex-row gap-10 lg:gap-14 py-10 lg:py-14 items-start">
        <nav className="w-full md:w-52 shrink-0 md:sticky md:top-24">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-3 px-3">Legal</p>
          <ul className="flex flex-row md:flex-col gap-1 flex-wrap">
            {LEGAL_PAGES.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  aria-current={p.slug === active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    p.slug === active
                      ? "bg-paper-tint text-ink"
                      : "text-ink-muted hover:text-ink hover:bg-paper-tint"
                  }`}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-[720px] w-full">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-ink-faint mb-12">Last updated {updated}</p>

          <div
            className="space-y-8 text-[15px] leading-relaxed text-ink-soft
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mb-3 [&_h2]:mt-0
              [&_p]:mb-3 [&_p:last-child]:mb-0
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
              [&_a]:text-primary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2"
          >
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
