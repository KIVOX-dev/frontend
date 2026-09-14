import { LandingIconProvider } from "@/components/landing/LandingIconProvider";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import AudienceBar from "@/components/landing/AudienceBar";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import RootHero from "@/components/landing/RootHero";
import QuickActions from "@/components/landing/QuickActions";
import PopularTracks from "@/components/landing/PopularTracks";
import AudienceHighlights from "@/components/landing/AudienceHighlights";
import TrustedByColleges from "@/components/landing/TrustedByColleges";
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
import type { AudienceKey } from "./audiences";

// Shared body for the 3 audience-specific marketing pages (/, /for-hr,
// /for-institutions) — each route's page.tsx is just this component plus
// its own <Metadata>. Only the top bar's active tab, the nav's wordmark
// suffix/CTA, and the hero content vary per audience (see audiences.ts);
// everything else — logos, features, FAQ, footer — is common across all
// three, same as this site's original single-page structure.
export function LandingPageBody({ audience }: { audience: AudienceKey }) {
  return (
    <main className="landing-typeset bg-paper min-h-screen font-jakarta antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-ink focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <LandingIconProvider>
        <SmoothScroll>
          <AudienceBar />
          <LandingNav audience={audience} />
          {audience === "learner" ? (
            <>
              <RootHero />
              <QuickActions />
              <PopularTracks />
            </>
          ) : (
            <>
              <LandingHero audience={audience} />
              <AudienceHighlights audience={audience} />
            </>
          )}
          <TrustedByColleges />
          <PlatformStats />
          <SolutionsByRole audience={audience} />
          <ProductShowcase audience={audience} />
          <FeatureGrid />
          <ProcessSection />
          <BenefitsSection />
          <FAQSection />
          <ContactSection />
          <LandingCta />
          <LandingFooter />
        </SmoothScroll>
      </LandingIconProvider>
    </main>
  );
}
