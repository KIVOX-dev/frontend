import type { Metadata } from "next";

import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import ProblemSection from "@/components/landing/ProblemSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ProductShowcase from "@/components/landing/ProductShowcase";
import ProcessSection from "@/components/landing/ProcessSection";
import TrustSection from "@/components/landing/TrustSection";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "BUDDIES — AI-Powered Career Intelligence & Placement Platform",
  description:
    "The most advanced platform for AI-powered aptitude training, career pathing, and campus-to-corporate success. Trusted by 500+ institutions and 10,000+ students.",
  keywords: "aptitude training, placement preparation, AI assessment, campus placement, career intelligence",
  openGraph: {
    title: "BUDDIES — AI Career Intelligence Platform",
    description: "Train Smarter. Score Higher. Get Hired. The AI-powered platform for campus placements.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="bg-jet min-h-screen font-jakarta antialiased">
      <LandingNav />
      <LandingHero />
      <ProblemSection />
      <FeatureGrid />
      <ProductShowcase />
      <ProcessSection />
      <TrustSection />
      <LandingCta />
      <LandingFooter />
    </main>
  );
}
