import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { Troubleshooting } from "@/components/landing/campus/Troubleshooting";

export const metadata: Metadata = {
  title: "Troubleshooting for HR teams",
  description: "Fixes for sign-in, posting vacancies, applicants, the talent board and candidate analytics in the TalentSnaps HR portal.",
};

export default function HrTroubleshootingPage() {
  return (
    <CampusShell audience="hr">
      <Troubleshooting audience="hr" />
    </CampusShell>
  );
}
