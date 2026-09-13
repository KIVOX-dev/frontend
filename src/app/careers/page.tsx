import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";

export const metadata: Metadata = {
  title: "Careers — TalentSnaps",
  description: "Working at TalentSnaps.",
};

const TOC = [
  { id: "what-we-look-for", label: "What we look for" },
  { id: "open-roles", label: "Open roles" },
  { id: "reach-out", label: "Reach out" },
];

export default function CareersPage() {
  return (
    <SitePageLayout title="We're a small team, based in Coimbatore." active="careers" toc={TOC}>
      <section>
        <p>
          TalentSnaps is early — a small team working directly with the placement cells we onboard,
          not a large org with a formal hiring pipeline yet. That means anyone who joins now works
          close to the actual product and the actual colleges using it, not one layer removed from
          either.
        </p>
      </section>

      <section>
        <h2 id="what-we-look-for">What we look for</h2>
        <ul>
          <li>People comfortable talking to placement staff directly, not just building for an assumed user.</li>
          <li>Ownership over a real part of the product, not a narrow ticket queue.</li>
          <li>Comfort with an early-stage pace — priorities shift as we learn from each college we onboard.</li>
        </ul>
      </section>

      <section>
        <h2 id="open-roles">Open roles</h2>
        <p>
          We don&apos;t keep a running job board — roles open as the team&apos;s actual needs
          change. If you want to work on this, write to us directly rather than watching for a
          listing.
        </p>
      </section>

      <section>
        <h2 id="reach-out">Reach out</h2>
        <p>
          Send what you&apos;re interested in working on to{" "}
          <a href="mailto:hello@talentsnaps.in">hello@talentsnaps.in</a> — a resume alone doesn&apos;t
          tell us much at this stage, so tell us what you&apos;d actually want to build.
        </p>
      </section>
    </SitePageLayout>
  );
}
