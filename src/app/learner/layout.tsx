import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "Student Login",
  description:
    "Sign in to TalentSnaps as a student: aptitude tests, mock interviews, courses, drives you're eligible for and your placement progress.",
};

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
