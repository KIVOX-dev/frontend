import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  alternates: { canonical: "/about-us" },
  title: "About Us",
  description:
    "TalentSnaps is built for college placement cells: drives, eligibility, round-by-round results and NIRF-ready placement records in one place, instead of spreadsheets and WhatsApp groups.",
};

const TOC = [
  { id: "what-were-building", label: "What we're building" },
  { id: "security", label: "Security & trust" },
  { id: "where-were-based", label: "Where we're based" },
  { id: "get-in-touch", label: "Get in touch" },
];

export default function AboutUsPage() {
  return (
    <SitePageLayout title="Built for the placement cell, not around it." active="about-us" toc={TOC}>
      <section>
        <p>
          Most Indian colleges run placements the same way they did fifteen years ago: a shared
          spreadsheet, a WhatsApp group for every drive, and a placement officer who ends up being
          the only person who actually knows the current state of things. It works, until it
          doesn&apos;t — until a NIRF submission needs three years of placement data with proof, or
          a recruiter asks for an eligibility list by end of day and the answer is scattered across
          four different files.
        </p>
        <p>
          TalentSnaps exists because that gap is solvable without asking a Tier 2 or Tier 3 college
          to hire a data team or rebuild how their placement cell already works.
        </p>
      </section>

      <section>
        <h2 id="what-were-building">What we&apos;re actually building</h2>
        <p>
          One student record that every module — drives, applications, screening, selection, offer
          letters, aptitude, skill tracking — writes to. Not eight disconnected tools that all claim
          to be a &quot;platform.&quot; A student who applies in August and gets an offer letter in
          March should be one row, not six.
        </p>
      </section>

      <section>
        <h2 id="security">Security &amp; trust</h2>
        <p>
          TalentSnaps is listed on the{" "}
          <a href="https://cloudsecurityalliance.org/star/registry/talentsnaps" target="_blank" rel="noopener noreferrer">
            Cloud Security Alliance STAR Registry
          </a>{" "}
          at STAR Level One. That means we&apos;ve published a self-assessment of our security
          controls against CSA&apos;s Consensus Assessments Initiative Questionnaire (CAIQ), which
          anyone can read on the registry. It covers how student and placement data is stored,
          who can access it, and how it&apos;s protected.
        </p>
        <p>
          Level One is a self-assessment, not an independent audit. If your college needs more
          detail for its own review, write to us at{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>

      <section>
        <h2 id="where-were-based">Where we&apos;re based</h2>
        <p>
          Built in Coimbatore. We work directly with placement cells at the colleges we onboard —
          setup, data import, and training are done with your team, not handed off to a support
          ticket queue.
        </p>
      </section>

      <section>
        <h2 id="get-in-touch">Get in touch</h2>
        <p>
          Questions about TalentSnaps, or want to talk before onboarding your college? Reach us at{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
