import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { Troubleshooting } from "@/components/landing/campus/Troubleshooting";

export const metadata: Metadata = {
  title: "Troubleshooting for institutions",
  description: "Fixes for college admins, faculty and students: drives, shortlists, student uploads, approvals, assessments and more.",
};

export default function InstitutionsTroubleshootingPage() {
  return (
    <CampusShell audience="institutions">
      <Troubleshooting audience="institutions" />
    </CampusShell>
  );
}
