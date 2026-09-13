import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageLayout } from "@/components/marketing/MarketingPageLayout";
import { partnerColleges } from "@/lib/partnerColleges";

export const metadata: Metadata = {
  title: "Partner Colleges — TalentSnaps",
  description: "What onboarding your college onto TalentSnaps actually looks like.",
};

export default function PartnerCollegesPage() {
  return (
    <MarketingPageLayout eyebrow="Partner Colleges" title="What partnering with us looks like.">
      <section>
        <p>
          Onboarding a college isn&apos;t a self-serve signup — someone from our team works with
          your placement cell directly, because the thing that actually makes TalentSnaps useful is
          getting your existing data (students, past drives, offer letters already on file) into it
          correctly on day one.
        </p>
      </section>

      <section>
        <h2>Colleges on TalentSnaps today</h2>
        <p>All in and around Coimbatore, across arts, science, commerce, and engineering.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {partnerColleges.map((college) => (
            <div
              key={college.code}
              title={college.name}
              className="flex h-20 items-center justify-center rounded-lg border border-line bg-white px-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={college.logo}
                alt={college.name}
                className="max-h-12 max-w-full w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>How onboarding works</h2>
        <ul>
          <li>We import your existing student and department data, so nothing is re-entered by hand.</li>
          <li>Your placement staff get set up on the actual workflow — drives, screening, offer letters — before the next placement season starts, not mid-season.</li>
          <li>Institution admin, faculty, and student accounts are provisioned with role-based access from day one.</li>
          <li>Support stays available through your first placement season, not just through setup.</li>
        </ul>
      </section>

      <section>
        <h2>Who this is for</h2>
        <p>
          Every department — arts, science, commerce, and engineering alike. We&apos;ve built this
          specifically with Tier 2 and Tier 3 colleges in mind, where the placement team is often
          two or three people covering the whole institution, not a dedicated placement office with
          its own IT support.
        </p>
      </section>

      <section>
        <h2>Interested in onboarding your college?</h2>
        <p>
          Talk to us at <a href="mailto:hello@talentsnaps.in">hello@talentsnaps.in</a>, or use the{" "}
          <Link href="/#ts-contact-form">contact form</Link> on the homepage.
        </p>
      </section>
    </MarketingPageLayout>
  );
}
