import type { Metadata } from "next";
import { LandingPageBody } from "@/components/landing/LandingPageBody";

export const metadata: Metadata = {
  title: "TalentSnaps for Institutions",
  description:
    "Run placement drives with HR, create and assign assessments, and oversee every department — all from one connected platform.",
  openGraph: {
    title: "TalentSnaps for Institutions",
    description: "Empower employability with one connected placement platform for your college.",
    type: "website",
  },
};

export default function ForInstitutionsPage() {
  return <LandingPageBody audience="institutional" />;
}
