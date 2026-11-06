import type { Metadata } from "next";
import localFont from "next/font/local";
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
// Fonts are self-hosted from the @fontsource-variable packages (latin subset, variable weight)
// instead of next/font/google: that downloads from Google at build time, and a CI/Docker build
// whose network gets an unexpected response from Google Fonts failed the whole build.
// Same families and CSS variable names as before, so every call site keeps working. The two
// duplicate `--font-display-*` loads were removed: nothing referenced them.
const plusJakartaSans = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-jakarta",
});

const spaceGrotesk = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--font-grotesk",
});

// Coursera's actual body/title/display typeface is "Source Sans Pro" — Google renamed the
// family to "Source Sans 3". Kept aliased to the existing `--font-inter` variable name (not
// renamed) so every font-jakarta/font-grotesk/font-inter call site keeps resolving.
const sourceSansPro = localFont({
  src: "../../node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2",
  weight: "200 900",
  display: "swap",
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
  description:
    "TalentSnaps is a campus placement platform where colleges run drives, students prove their skills with verified tests, and recruiters hire from verified records.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TalentSnaps",
    title: "TalentSnaps — Campus Placement & Assessment Management Platform",
    description:
      "TalentSnaps is a campus placement platform where colleges run drives, students prove their skills with verified tests, and recruiters hire from verified records.",
  },
  twitter: {
    // Large card: shows app/opengraph-image.png (the official stacked logo).
    card: "summary_large_image",
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
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${sourceSansPro.variable} ${sourceSansPro.className}`}
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
