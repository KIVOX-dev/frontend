import type { ReactNode } from "react";
import Link from "next/link";
import { ResponsiveLogo } from "@/components/shared/Logo";

export function LegalPageLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-paper min-h-screen font-jakarta antialiased">
      <header className="border-b border-line-soft">
        <div className="ui-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <ResponsiveLogo height={32} priority />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
              <path d="M10 3.5 5 8l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>
      </header>

      <article className="ui-container max-w-[760px] py-14 lg:py-20">
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
    </main>
  );
}
