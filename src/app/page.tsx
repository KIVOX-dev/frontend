import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { LearnersLanding } from "@/components/landing/campus/LearnersLanding";

export const metadata: Metadata = {
  // Absolute: the site template would otherwise make this "TalentSnaps — TalentSnaps".
  title: { absolute: "TalentSnaps: Campus Placements From First Year to First Offer" },
  description:
    "Your path from campus to your first offer: see every drive you're eligible for, track each round, and keep your reports and offer letter in one place.",
  keywords: "placement management system, college placement cell software, NIRF reporting, campus recruitment platform, student placement tracking",
  openGraph: {
    title: "TalentSnaps",
    description: "Your path from campus to your first offer.",
    type: "website",
  },
};

export default function Home() {
  return (
    <CampusShell audience="learners">
      <LearnersLanding />
    </CampusShell>
  );
}
