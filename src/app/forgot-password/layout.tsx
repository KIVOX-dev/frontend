import type { Metadata } from "next";
import "@/styles/legacy-shell.css";
import { LegacyRouteMarker } from "@/components/shared/LegacyStyleGuard";

export const metadata: Metadata = {
  title: "Forgot Your Password?",
  description:
    "Reset your TalentSnaps password. Enter your account email and we'll send you a secure reset link.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyRouteMarker />
      {children}
    </>
  );
}
