import type { Metadata } from "next";
import { LandingPageBody } from "@/components/landing/LandingPageBody";

export const metadata: Metadata = {
  title: "UpScalerAI",
  description:
    "One intelligent platform connecting HR, students, faculty, and administrators across your institution. Manage attendance, academics, payroll, and reporting from a single system.",
  keywords: "education management system, college ERP, student information system, HR management, faculty management, institution administration",
  openGraph: {
    title: "UpScalerAI",
    description: "Manage your entire institution from one intelligent platform — built for HR, students, faculty, and administrators.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPageBody audience="learner" />;
}
