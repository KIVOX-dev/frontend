import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Changelog — TalentSnaps",
  description: "What's shipped on TalentSnaps, roughly in the order it happened.",
};

const TOC = [
  { id: "2026-09", label: "September 2026" },
  { id: "2026-08", label: "August 2026" },
  { id: "2026-07", label: "July 2026" },
];

export default function ChangelogPage() {
  return (
    <SitePageLayout title="What's new." active="changelog" toc={TOC}>
      <section>
        <p>
          There&apos;s no version numbering here — it&apos;s a small team shipping directly to the
          colleges we&apos;ve onboarded, not a packaged release schedule. This page is a rough,
          honest log of what changed and roughly when, grouped by month rather than a specific date.
        </p>
      </section>

      <section>
        <h2 id="2026-09">September 2026</h2>
        <ul>
          <li>Rebranded the platform to TalentSnaps, across the app and every marketing page.</li>
          <li>Added the HR hiring workflow: vacancy posting, the AI-ranked Talent Board, and offer letters.</li>
          <li>Rebuilt the institutional portal — role-based dashboards for admins and faculty, plus a working topbar search across users, placements, and drives.</li>
          <li>Gave HR, institutions, and students each their own marketing page instead of one shared pitch.</li>
        </ul>
      </section>

      <section>
        <h2 id="2026-08">August 2026</h2>
        <ul>
          <li>Built out the College Admin Dashboard — departments, assessments, and results in one place.</li>
          <li>Added the core dashboard modules and the shared UI component library everything else builds on.</li>
        </ul>
      </section>

      <section>
        <h2 id="2026-07">July 2026</h2>
        <ul>
          <li>First working version: role-based login and shell layouts for students, faculty, HR, and admins.</li>
        </ul>
        <p>
          Older than this and it&apos;s foundational scaffolding, not something worth listing item by
          item. Questions about a specific change? Ask at{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
