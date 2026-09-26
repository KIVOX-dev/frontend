import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "Verify Your Email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
