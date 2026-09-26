import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { ConsentedAnalytics } from "@/components/shared/ConsentedAnalytics";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { LegacyStyleGuard } from "@/components/shared/LegacyStyleGuard";
import { STALE_BUILD_GUARD_SCRIPT } from "@/lib/staleBuild";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";

// Plus Jakarta Sans / Space Grotesk are kept loaded so the pre-existing
// font-jakarta/font-grotesk utility classes elsewhere in the app keep
// resolving to a valid font (they're aliased to Source Sans Pro in
// globals.css's @theme block, per the sitewide Coursera-parity font spec —
// see the `--font-jakarta`/`--font-grotesk` definitions there, still used
// by e.g. ResumeBuilder.tsx). Source Sans Pro is the actual default applied
// on <body> below.
//
// These two get their own distinct variable names (`--font-display-*`)
// rather than reusing `--font-jakarta`/`--font-grotesk`, kept loaded for any
// call site that still references them directly, though the landing page no
// longer opts into a separate display font (see `.landing-typeset` in
// globals.css) — Coursera itself uses one typeface everywhere.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
});

const displayJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-jakarta",
});

const displayGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-grotesk",
});
// Coursera's actual body/title/display typeface is "Source Sans Pro" — Google
// renamed the family to "Source Sans 3" for its variable-font rebuild, which
// is what next/font/google now serves under that name. Kept aliased to the
// existing `--font-inter` variable name (not renamed) so every
// font-jakarta/font-grotesk/font-inter call site across the app keeps
// resolving without being touched individually.
const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

// Favicon / apple-touch-icon / manifest are wired via Next's file-convention
// (src/app/icon.png, src/app/apple-icon.png, src/app/manifest.ts) — no manual
// `icons` block needed here; Next auto-generates the right <link> tags.
//
// metadataBase + openGraph/twitter here, plus the Organization/WebSite
// JSON-LD below, are the on-page half of getting a Google sitelinks-style
// result (title + description + expandable sub-page links) — the other
// half (submitting the sitemap in Search Console, and time for Google to
// judge the site trustworthy enough) isn't something a code change can do.
const SITE_URL = "https://www.talentsnaps.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TalentSnaps — Campus Placement & Assessment Management Platform",
    template: "%s — TalentSnaps",
  },
  description: "One intelligent platform connecting HR, students, faculty, and administrators across your institution's placement cell.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TalentSnaps",
    title: "TalentSnaps — Campus Placement & Assessment Management Platform",
    description: "One intelligent platform connecting HR, students, faculty, and administrators across your institution's placement cell.",
  },
  twitter: {
    card: "summary",
    title: "TalentSnaps",
    description: "Campus Placement & Assessment Management Platform",
  },
  robots: { index: true, follow: true },
};

// Structured data Google uses for the site name, logo and knowledge panel in
// search results. The two entities reference each other by @id.
// Add official profile URLs (LinkedIn, YouTube, X...) to `sameAs` once they
// exist; Google uses them to link the brand's social profiles.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "TalentSnaps",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
  email: "admin@talentsnaps.com",
  description:
    "Campus placement platform connecting students, colleges and hiring teams: eligibility-checked drives, round-by-round tracking, verified assessments and NIRF-ready reports.",
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "admin@talentsnaps.com", areaServed: "IN" },
  sameAs: [] as string[],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "TalentSnaps",
  alternateName: ["Talent Snaps", "talentsnaps.com"],
  url: SITE_URL,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* First thing on the page, so it's listening before any of the
            site's own script files load — see lib/staleBuild.ts. */}
        <script dangerouslySetInnerHTML={{ __html: STALE_BUILD_GUARD_SCRIPT }} />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${sourceSansPro.variable} ${displayJakarta.variable} ${displayGrotesk.variable} ${sourceSansPro.className}`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
        <LegacyStyleGuard />
        <CookieConsent />
        <ConsentedAnalytics />
      </body>
    </html>
  );
}
