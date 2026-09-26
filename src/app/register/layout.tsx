import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "Create an Account",
  description:
    "Create a free TalentSnaps account to practise aptitude tests and mock interviews, or register your company to hire from campus.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
