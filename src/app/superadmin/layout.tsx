import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  // Deliberately generic: this route is never linked or listed anywhere.
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
