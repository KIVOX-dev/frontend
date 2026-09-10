import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
export const metadata: Metadata = {
  title: "UpScalerAI",
  description: "Campus Placement & Assessment Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${sourceSansPro.variable} ${displayJakarta.variable} ${displayGrotesk.variable} ${sourceSansPro.className}`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
