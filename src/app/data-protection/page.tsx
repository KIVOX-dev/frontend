import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Data Protection — TalentSnaps",
  description: "How TalentSnaps secures placement data and what happens to it if you leave.",
};

export default function DataProtectionPage() {
  return (
    <LegalPageLayout title="Data Protection" updated="September 2026" active="data-protection">
      <section>
        <h2>1. Role-based access</h2>
        <p>
          TalentSnaps enforces access at the role level, not just at login: a student can see only
          their own record, a placement coordinator sees only their institution&apos;s students and
          drives, and a recruiter sees only applicants to drives they&apos;re actually running.
          Nobody shares a login, and no role sees more than its job needs.
        </p>
      </section>

      <section>
        <h2>2. Audit trail</h2>
        <p>
          Every verification — an offer letter marked confirmed, a student marked selected, a
          record edited — carries the name of the person who did it and a timestamp. This means a
          disputed record can always be traced back to who signed it off, not just when it changed.
        </p>
      </section>

      <section>
        <h2>3. Encryption and storage</h2>
        <p>
          Data in transit between your browser and TalentSnaps is encrypted (HTTPS/TLS). Uploaded
          documents, including offer letters, are stored with access restricted to the roles
          entitled to view them under section 1.
        </p>
      </section>

      <section>
        <h2>4. Your data stays yours</h2>
        <p>
          Nothing your institution puts into TalentSnaps is locked in. Students, drives, offers,
          and reports can be exported in full at any time in .xlsx, .csv, or .pdf format — the same
          formats your office already works with.
        </p>
      </section>

      <section>
        <h2>5. If your institution stops using TalentSnaps</h2>
        <p>
          Your institution can request a full export of all its data before closing an account.
          After a transition period, remaining data is permanently deleted from active systems on
          request. We don&apos;t retain institutional data indefinitely after an account closes.
        </p>
      </section>

      <section>
        <h2>6. Reporting a concern</h2>
        <p>
          If you believe your data has been accessed inappropriately, or you have a security
          concern, contact <a href="mailto:hello@talentsnaps.in">hello@talentsnaps.in</a> and we&apos;ll
          investigate.
        </p>
      </section>
    </LegalPageLayout>
  );
}
