import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Data Protection — TalentSnaps",
  description: "How TalentSnaps secures placement data and what happens to it if you leave.",
};

const TOC = [
  { id: "role-based-access", label: "Role-based access" },
  { id: "audit-trail", label: "Audit trail" },
  { id: "encryption-and-storage", label: "Encryption and storage" },
  { id: "your-data-stays-yours", label: "Your data stays yours" },
  { id: "if-you-leave", label: "If you stop using TalentSnaps" },
  { id: "reporting-a-concern", label: "Reporting a concern" },
];

export default function DataProtectionPage() {
  return (
    <SitePageLayout title="Data Protection" updated="September 2026" active="data-protection" toc={TOC}>
      <section>
        <h2 id="role-based-access">1. Role-based access</h2>
        <p>
          TalentSnaps enforces access at the role level, not just at login: a student can see only
          their own record, a placement coordinator sees only their institution&apos;s students and
          drives, and a recruiter sees only applicants to drives they&apos;re actually running.
          Nobody shares a login, and no role sees more than its job needs.
        </p>
      </section>

      <section>
        <h2 id="audit-trail">2. Audit trail</h2>
        <p>
          Every verification — an offer letter marked confirmed, a student marked selected, a
          record edited — carries the name of the person who did it and a timestamp. This means a
          disputed record can always be traced back to who signed it off, not just when it changed.
        </p>
      </section>

      <section>
        <h2 id="encryption-and-storage">3. Encryption and storage</h2>
        <p>
          Data in transit between your browser and TalentSnaps is encrypted (HTTPS/TLS). Uploaded
          documents, including offer letters, are stored with access restricted to the roles
          entitled to view them under section 1.
        </p>
      </section>

      <section>
        <h2 id="your-data-stays-yours">4. Your data stays yours</h2>
        <p>
          Nothing your institution puts into TalentSnaps is locked in. Students, drives, offers,
          and reports can be exported in full at any time in .xlsx, .csv, or .pdf format — the same
          formats your office already works with.
        </p>
      </section>

      <section>
        <h2 id="if-you-leave">5. If your institution stops using TalentSnaps</h2>
        <p>
          Your institution can request a full export of all its data before closing an account.
          After a transition period, remaining data is permanently deleted from active systems on
          request. We don&apos;t retain institutional data indefinitely after an account closes.
        </p>
      </section>

      <section>
        <h2 id="reporting-a-concern">6. Reporting a concern</h2>
        <p>
          If you believe your data has been accessed inappropriately, or you have a security
          concern, contact <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a> and we&apos;ll
          investigate.
        </p>
      </section>
    </SitePageLayout>
  );
}
