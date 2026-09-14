import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — TalentSnaps",
  description: "How TalentSnaps collects, uses, and protects student, faculty, and recruiter data.",
};

const TOC = [
  { id: "what-this-covers", label: "What this policy covers" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use-it", label: "How we use it" },
  { id: "who-can-see", label: "Who can see your data" },
  { id: "retention-and-export", label: "Data retention and export" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <SitePageLayout title="Privacy Policy" updated="September 2026" active="privacy-policy" toc={TOC}>
      <section>
        <h2 id="what-this-covers">1. What this policy covers</h2>
        <p>
          This policy explains what personal data TalentSnaps collects when students, faculty,
          placement staff, and recruiters use the platform, why we collect it, and the choices
          you have over it. It applies to the TalentSnaps web application and any connected
          mobile experiences.
        </p>
      </section>

      <section>
        <h2 id="data-we-collect">2. Data we collect</h2>
        <ul>
          <li>Account details: name, email address, phone number, role, and institution.</li>
          <li>Academic records: department, year, CGPA, backlog status, and course history, where submitted by your institution.</li>
          <li>Placement activity: drive applications, screening rounds, aptitude test results, and offer letters you upload.</li>
          <li>Usage data: pages visited, session timestamps, and device/browser information, collected automatically.</li>
        </ul>
      </section>

      <section>
        <h2 id="how-we-use-it">3. How we use it</h2>
        <p>
          We use this data to run the placement workflow your institution has configured —
          matching students to eligible drives, tracking application and offer status, generating
          skill reports, and producing NIRF/NAAC-ready exports for your placement cell. We do not
          sell personal data to third parties.
        </p>
      </section>

      <section>
        <h2 id="who-can-see">4. Who can see your data</h2>
        <p>
          Access is role-based: students see their own record, placement coordinators see their
          institution&apos;s students, and recruiters see only the applicant data relevant to a
          drive they&apos;re running. Every access-affecting action is timestamped in an audit trail.
        </p>
      </section>

      <section>
        <h2 id="retention-and-export">5. Data retention and export</h2>
        <p>
          Your institution can export its own students, drives, offers, and reports at any time in
          .xlsx, .csv, or .pdf format. If your institution stops using TalentSnaps, data is retained
          for a transition period and then deleted on request — see{" "}
          <a href="/data-protection">Data Protection</a> for details.
        </p>
      </section>

      <section>
        <h2 id="contact">6. Contact</h2>
        <p>
          Questions about this policy or a specific data request can be sent to{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
