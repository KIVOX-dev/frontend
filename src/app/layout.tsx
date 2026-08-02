import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";

// Plus Jakarta Sans / Space Grotesk are kept loaded so the pre-existing
// font-jakarta/font-grotesk utility classes sprinkled across the app keep
// resolving to a valid font (they're aliased to Inter in globals.css's
// @theme block, per the "use only Inter" design spec — see the
// `--font-jakarta`/`--font-grotesk` definitions there). Inter is the actual
// default applied on <body> below.
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
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UpScaler — AI Aptitude Trainer & Career Intelligence",
  description: "Campus Placement & Assessment Management Platform",
  icons: {
    icon: "/logos/app_icon_blue.png",
    shortcut: "/logos/app_icon_blue.png",
    apple: "/logos/app_icon_blue.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${inter.variable} ${inter.className}`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
