import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";

// Plus Jakarta Sans / Space Grotesk are kept loaded so the pre-existing
// font-jakarta/font-grotesk utility classes elsewhere in the app keep
// resolving to a valid font (they're aliased to Inter in globals.css's
// @theme block, per the "use only Inter" design spec for the dashboard/
// portal surfaces — see the `--font-jakarta`/`--font-grotesk` definitions
// there, still used by e.g. ResumeBuilder.tsx). Inter is the actual default
// applied on <body> below.
//
// These two get their own distinct variable names (`--font-display-*`)
// rather than reusing `--font-jakarta`/`--font-grotesk`, so the landing
// page can opt into the real fonts (see `.landing-typeset` in globals.css)
// without touching that sitewide Inter alias or ResumeBuilder's rendering.
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
const inter = Inter({
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
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${inter.variable} ${displayJakarta.variable} ${displayGrotesk.variable} ${inter.className}`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
