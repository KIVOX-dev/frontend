import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { Troubleshooting } from "@/components/landing/campus/Troubleshooting";

export const metadata: Metadata = {
  title: "Troubleshooting for students",
  description: "Fixes for sign-in, aptitude tests, proctored assessments, mock interviews, resume builder, placements and every other student module.",
};

export default function LearnerTroubleshootingPage() {
  return (
    <CampusShell audience="learners">
      <Troubleshooting audience="learners" />
    </CampusShell>
  );
}
