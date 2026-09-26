import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "Set a New Password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
