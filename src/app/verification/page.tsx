import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Verification",
  description: "What TalentSnaps actually verifies before a student shows up on a Talent Board.",
};

const TOC = [
  { id: "whats-verified", label: "What gets verified" },
  { id: "how-a-score-is-built", label: "How a score is built" },
  { id: "why-it-matters", label: "Why it matters to recruiters" },
];

export default function VerificationPage() {
  return (
    <SitePageLayout title="A score on TalentSnaps means someone actually took the test." active="verification" toc={TOC}>
      <section>
        <p>
          A resume claim (&quot;proficient in SQL,&quot; &quot;strong problem solver&quot;) costs
          nothing to write and nothing to verify. TalentSnaps doesn&apos;t take that claim at face
          value — it puts the student through the same aptitude tests and two-round mock
          interviews everyone else on the platform takes, and the result is what shows up on their
          profile and the Talent Board.
        </p>
      </section>

      <section>
        <h2 id="whats-verified">What gets verified</h2>
        <ul>
          <li><strong>Aptitude Tests</strong> — the standard quantitative, logical, and verbal rounds most placement drives already screen on.</li>

          <li><strong>Mock Interviewer</strong> — a written test in the target company&apos;s pattern with technical questions for the role, then a spoken interview, both scored rather than a checklist of &quot;attended.&quot;</li>
        </ul>
        <p>
          Every attempt is timed and graded the same way for every student — there&apos;s no
          separate &quot;easy&quot; and &quot;hard&quot; version depending on who&apos;s taking it.
        </p>
      </section>

      <section>
        <h2 id="how-a-score-is-built">How a score is built</h2>
        <p>
          Accuracy across a student&apos;s completed tests rolls up into the Score column recruiters
          see on the Talent Board and in a student&apos;s Skill Report. It&apos;s a reflection of
          tests actually completed, not a self-reported number — a student with one attempt and a
          student with ten don&apos;t get compared as if they&apos;d done the same amount of work.
        </p>
      </section>

      <section>
        <h2 id="why-it-matters">Why it matters to recruiters</h2>
        <p>
          A college&apos;s placement cell already knows which students show up and try. TalentSnaps
          gives an HR team the same signal without needing to sit in on every round themselves —
          the Talent Board and Skill Report are built from tests the platform administered directly,
          not a spreadsheet someone filled in.
        </p>
        <p>
          Have questions about how a specific score was produced? Write to{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
