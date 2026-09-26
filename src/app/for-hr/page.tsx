import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { HrLanding } from "@/components/landing/campus/HrLanding";

export const metadata: Metadata = {
  title: "TalentSnaps for HR",
  description:
    "Hire from campus with verified records: post a drive once, receive only eligible applicants, screen them round by round and share results with every placement cell.",
  openGraph: {
    title: "TalentSnaps for HR",
    description: "Hire from campus with verified records.",
    type: "website",
  },
};

export default function ForHrPage() {
  return (
    <CampusShell audience="hr">
      <HrLanding />
    </CampusShell>
  );
}
