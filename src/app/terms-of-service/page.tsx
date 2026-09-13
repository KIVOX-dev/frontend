import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service — TalentSnaps",
  description: "The terms governing use of the TalentSnaps placement platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="September 2026">
      <section>
        <h2>1. Accepting these terms</h2>
        <p>
          By creating an account or using TalentSnaps — as a student, faculty member, placement
          coordinator, or recruiter — you agree to these terms. If you&apos;re using TalentSnaps on
          behalf of an institution or company, you&apos;re confirming you have authority to accept
          these terms for that organization.
        </p>
      </section>

      <section>
        <h2>2. Accounts and roles</h2>
        <p>
          Every account belongs to exactly one role — student, faculty/admin, placement
          coordinator, or recruiter — set by your institution or by TalentSnaps during onboarding.
          You&apos;re responsible for keeping your login credentials confidential and for activity
          that happens under your account.
        </p>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <ul>
          <li>Don&apos;t submit false eligibility information, forged offer letters, or misrepresent placement outcomes.</li>
          <li>Don&apos;t use the platform to contact students or recruiters outside the scope of a listed drive.</li>
          <li>Don&apos;t attempt to access records outside your role&apos;s permissions.</li>
          <li>Don&apos;t scrape, resell, or redistribute data exported from the platform without authorization from your institution.</li>
        </ul>
      </section>

      <section>
        <h2>4. Institution and recruiter responsibilities</h2>
        <p>
          Institutions are responsible for the accuracy of student and department data they load
          into TalentSnaps, and for verifying offer letters before marking them confirmed.
          Recruiters are responsible for the accuracy of drive details and vacancy criteria they
          publish.
        </p>
      </section>

      <section>
        <h2>5. Service availability</h2>
        <p>
          We aim to keep TalentSnaps available during placement season and beyond, but scheduled
          maintenance or unforeseen issues may occasionally interrupt access. We&apos;ll notify
          affected institutions in advance of planned downtime where possible.
        </p>
      </section>

      <section>
        <h2>6. Termination</h2>
        <p>
          An institution may stop using TalentSnaps at any time and request a full data export
          before deletion. We may suspend an individual account that violates the acceptable use
          terms above, after notifying the relevant placement cell.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:hello@talentsnaps.in">hello@talentsnaps.in</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
