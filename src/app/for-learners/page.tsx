import type { Metadata } from "next";
import { LandingIconProvider } from "@/components/landing/LandingIconProvider";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import AudienceBar from "@/components/landing/AudienceBar";
import LandingNav from "@/components/landing/LandingNav";
import TalentSnapsLanding from "@/components/landing/talentsnaps/TalentSnapsLanding";
import { LEARNER_CONTENT } from "@/components/landing/talentsnaps/landingContent";

export const metadata: Metadata = {
  title: "TalentSnaps for Learners",
  description:
    "AI-scored aptitude tests, mock interviews with real-time feedback, and a resume builder that writes itself from your practice record — plus a national leaderboard so you always know exactly where you stand.",
  openGraph: {
    title: "TalentSnaps for Learners",
    description: "Practice smarter. Get placed faster.",
    type: "website",
  },
};

export default function ForLearnersPage() {
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
            <TalentSnapsLanding content={LEARNER_CONTENT} />
          </div>
        </SmoothScroll>
      </LandingIconProvider>
    </main>
  );
}
