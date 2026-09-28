import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { LearnersLanding } from "@/components/landing/campus/LearnersLanding";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Absolute: the site template would otherwise make this "TalentSnaps — TalentSnaps".
  title: { absolute: "TalentSnaps: Campus Placements From First Year to First Offer" },
  description:
    "TalentSnaps is a campus placement platform where colleges run drives, students prove their skills with verified tests, and recruiters hire from verified records.",
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
