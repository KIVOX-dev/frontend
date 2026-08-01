import type { Metadata } from "next";

import { SmoothScroll } from "@/components/landing/SmoothScroll";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import ProblemSection from "@/components/landing/ProblemSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ProductShowcase from "@/components/landing/ProductShowcase";
import ProcessSection from "@/components/landing/ProcessSection";
import TrustSection from "@/components/landing/TrustSection";
import FAQSection from "@/components/landing/FAQSection";
import LandingCta from "@/components/landing/LandingCta";
import ContactSection from "@/components/landing/ContactSection";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "UpScaler — AI-Powered Career Growth & Placement Platform",
  description:
    "The most advanced platform for AI-powered aptitude training, career pathing, and campus-to-corporate success. Trusted by 500+ institutions and 10,000+ students.",
  keywords: "aptitude training, placement preparation, AI assessment, campus placement, career intelligence",
  openGraph: {
    title: "UpScaler — AI Career Growth Platform",
    description: "Upscale Your Skills. Outscore the Competition. Get Hired. The AI-powered platform for campus placements.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="bg-paper min-h-screen font-jakarta antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-ink focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <SmoothScroll>
        <LandingNav />
        <LandingHero />
        <ProblemSection />
        <FeatureGrid />
        <ProductShowcase />
        <ProcessSection />
        <TrustSection />
        <FAQSection />
        <LandingCta />
        <ContactSection />
        <LandingFooter />
      </SmoothScroll>
    </main>
  );
}
