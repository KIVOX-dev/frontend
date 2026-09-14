import type { Metadata } from "next";
import { LandingIconProvider } from "@/components/landing/LandingIconProvider";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import AudienceBar from "@/components/landing/AudienceBar";
import LandingNav from "@/components/landing/LandingNav";
import TalentSnapsLanding from "@/components/landing/talentsnaps/TalentSnapsLanding";
import { HR_CONTENT } from "@/components/landing/talentsnaps/landingContent";

export const metadata: Metadata = {
  title: "TalentSnaps for HR",
  description:
    "Post job vacancies, review AI-scored applicant profiles, and hire top campus talent from a global talent leaderboard — no separate ATS needed.",
  openGraph: {
    title: "TalentSnaps for HR",
    description: "The AI-powered hiring platform for campus recruiting.",
    type: "website",
  },
};

export default function ForHrPage() {
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
          <LandingNav audience="hr" />
          <div id="main-content">
            <TalentSnapsLanding content={HR_CONTENT} />
          </div>
        </SmoothScroll>
      </LandingIconProvider>
    </main>
  );
}
