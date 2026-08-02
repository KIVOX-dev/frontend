import type { Metadata } from "next";

import { SmoothScroll } from "@/components/landing/SmoothScroll";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import PlatformStats from "@/components/landing/PlatformStats";
import SolutionsByRole from "@/components/landing/SolutionsByRole";
import ProductShowcase from "@/components/landing/ProductShowcase";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ProcessSection from "@/components/landing/ProcessSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "UpScaler — Complete Education Management Platform",
  description:
    "One intelligent platform connecting HR, students, faculty, and administrators across your institution. Manage attendance, academics, payroll, and reporting from a single system.",
  keywords: "education management system, college ERP, student information system, HR management, faculty management, institution administration",
  openGraph: {
    title: "UpScaler — Complete Education Management Platform",
    description: "Manage your entire institution from one intelligent platform — built for HR, students, faculty, and administrators.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="bg-paper min-h-screen font-jakarta antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-ink focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <SmoothScroll>
        <LandingNav />
        <LandingHero />
        <PlatformStats />
        <SolutionsByRole />
        <ProductShowcase />
        <FeatureGrid />
        <ProcessSection />
        <BenefitsSection />
        <FAQSection />
        <ContactSection />
        <LandingCta />
        <LandingFooter />
      </SmoothScroll>
    </main>
  );
}
