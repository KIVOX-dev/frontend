import type { Metadata } from "next";
import { LandingIconProvider } from "@/components/landing/LandingIconProvider";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import AudienceBar from "@/components/landing/AudienceBar";
import LandingNav from "@/components/landing/LandingNav";
import TalentSnapsLanding from "@/components/landing/talentsnaps/TalentSnapsLanding";

export const metadata: Metadata = {
  title: "TalentSnaps",
  description:
    "The complete placement suite for your college — drives, applications, screening, offer letters, aptitude and NIRF reporting, all on one student record.",
  keywords: "placement management system, college placement cell software, NIRF reporting, campus recruitment platform, student placement tracking",
  openGraph: {
    title: "TalentSnaps",
    description: "The complete placement suite for your college.",
    type: "website",
  },
};

export default function Home() {
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
          <LandingNav audience="learner" />
          <div id="main-content">
            <TalentSnapsLanding />
          </div>
        </SmoothScroll>
      </LandingIconProvider>
    </main>
  );
}
