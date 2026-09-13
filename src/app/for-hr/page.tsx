import type { Metadata } from "next";
import { LandingPageBody } from "@/components/landing/LandingPageBody";

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
  return <LandingPageBody audience="hr" />;
}
