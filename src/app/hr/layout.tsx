import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "HR & Recruiter Login",
  description:
    "Sign in to the TalentSnaps recruiter portal to post vacancies, review applicants from partner colleges and track every round.",
};

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
