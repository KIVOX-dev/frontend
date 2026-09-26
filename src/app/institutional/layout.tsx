import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "College Login: Admins, Faculty & Students",
  description:
    "Sign in to the TalentSnaps institutional portal to run placement drives, assessments, student tracking and NIRF-ready reports.",
};

export default function InstitutionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
