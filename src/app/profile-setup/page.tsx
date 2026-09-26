import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Profile Setup",
  description: "How a student goes from signing up to appearing on the Talent Board.",
};

const TOC = [
  { id: "one-getting-in", label: "1. Get added by your college" },
  { id: "two-build-it", label: "2. Build out your profile" },
  { id: "three-get-verified", label: "3. Take the verification tests" },
  { id: "four-apply", label: "4. Show up where recruiters look" },
];

export default function ProfileSetupPage() {
  return (
    <SitePageLayout title="Setting up your profile." active="profile-setup" toc={TOC}>
      <section>
        <p>
          There&apos;s no separate sign-up flow to figure out — a TalentSnaps account only exists
          because your college&apos;s placement cell added you. From there, the profile itself is
          a few real steps, not a form you fill in once and forget.
        </p>
      </section>

      <section>
        <h2 id="one-getting-in">1. Get added by your college</h2>
        <p>
          Your placement cell (or faculty) creates your account as part of onboarding your batch —
          see <a href="/for-institutions">TalentSnaps for Institutions</a> for how that works on the
          institution&apos;s side. You log in as a student once that&apos;s done.
        </p>
      </section>

      <section>
        <h2 id="two-build-it">2. Build out your profile</h2>
        <p>
          Two tools do the actual work: <strong>Resume Builder</strong> turns your details into a
          real resume, and <strong>Profile Summarizer</strong> pulls that into the summary recruiters
          see alongside your test scores. Neither is optional filler — an incomplete profile is
          exactly what it looks like to an HR team scanning the Talent Board.
        </p>
      </section>

      <section>
        <h2 id="three-get-verified">3. Take the verification tests</h2>
        <p>
          Aptitude Tests and the Mock Interviewer (a written round, then a spoken one) are what actually produce your
          Score and Skill Report — see <a href="/verification">Verification</a> for what each one
          checks and how the score is built. Nothing on your profile counts as verified until you&apos;ve
          taken it.
        </p>
      </section>

      <section>
        <h2 id="four-apply">4. Show up where recruiters look</h2>
        <p>
          Once you&apos;ve got a score, you&apos;re ranked on the Top Talent Board and eligible for
          placement drives your college posts. Test History keeps every attempt on record, so a
          recruiter — or you — can see exactly how a score was earned.
        </p>
        <p>
          Stuck at any step? Ask your placement cell first — most setup issues are account-side, not
          something we can fix from here. Otherwise, write to{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
