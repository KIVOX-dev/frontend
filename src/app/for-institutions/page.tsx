import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { InstitutionsLanding } from "@/components/landing/campus/InstitutionsLanding";

export const metadata: Metadata = {
  title: "TalentSnaps for Institutions",
  description:
    "Run your whole placement season from one place: announce drives, collect applications, run screening, track selections and collect offer letters, with numbers ready for NIRF.",
  openGraph: {
    title: "TalentSnaps for Institutions",
    description: "Run your whole placement season from one place.",
    type: "website",
  },
};

export default function ForInstitutionsPage() {
  return (
    <CampusShell audience="institutions">
      <InstitutionsLanding />
    </CampusShell>
  );
}
