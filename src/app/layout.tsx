import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

// Landing-page-only fonts (Space Grotesk for headings, Inter for body) per
// the dark redesign brief. Loaded here at the root (required by next/font)
// but only ever applied via the `font-grotesk`/`font-inter` utility classes
// inside the landing page itself — the rest of the app (dashboards) keeps
// Plus Jakarta Sans as its default, applied on <body> below.
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
  title: "UpScaler AI — AI Aptitude Trainer & Career Intelligence",
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
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${inter.variable} ${plusJakartaSans.className}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
