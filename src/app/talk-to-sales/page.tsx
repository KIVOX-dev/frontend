import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";
import { TalkToSalesForm } from "@/components/landing/TalkToSalesForm";

const INBOX = "admin@talentsnaps.com";

export const metadata: Metadata = {
  alternates: { canonical: "/talk-to-sales" },
  title: "Talk to Sales",
  description:
    "Talk to the TalentSnaps team about running your college's placements or hiring from campus. Tell us what you need and we'll reach you within 24 hours.",
};

export default function TalkToSalesPage() {
  return (
    <SitePageLayout title="This call goes straight to our founding team." active="talk-to-sales">
      <section>
        <p>
          Tell us about your placement cell or hiring team. Someone who builds TalentSnaps will walk you through how it fits
          the way you already run drives, not a scripted sales demo.
        </p>
        <TalkToSalesForm inbox={INBOX} />
        <p>
          Prefer email? Write to <a href={`mailto:${INBOX}`}>{INBOX}</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
