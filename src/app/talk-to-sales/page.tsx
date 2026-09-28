import type { Metadata } from "next";
import { CampusShell } from "@/components/landing/campus/CampusShell";
import { Icon } from "@/components/landing/campus/primitives";
import { TalkToSalesForm } from "@/components/landing/TalkToSalesForm";

const INBOX = "admin@talentsnaps.com";

export const metadata: Metadata = {
  alternates: { canonical: "/talk-to-sales" },
  title: "Talk to Sales",
  description:
    "Talk to the TalentSnaps team about running your college's placements or hiring from campus. Tell us what you need and we'll reach you within 24 hours.",
};

const PROMISES = [
  "You talk to someone who builds TalentSnaps, not a sales script",
  "We start from how you run drives today: spreadsheets, WhatsApp groups and all",
  "You leave with a clear setup plan for your placement cell or hiring team",
  "No pressure. Take the time you need to decide.",
];

// A page of its own (linked from the footer's Contact column), not one of the
// three audience landings, so the shell highlights no audience tab.
export default function TalkToSalesPage() {
  return (
    <CampusShell audience="institutions" standalone>
      <div className="row">
        <div className="split top">
          <div className="cell txt">
            <span className="eb">
              <i></i>Talk to TalentSnaps
            </span>
            <h1 className="dt h3">This call goes straight to our founding team</h1>
            <p className="lede">
              30 minutes with someone who builds TalentSnaps, on how it fits the way your placement cell or hiring team
              already works.
            </p>
            <ul className="ticks">
              {PROMISES.map((p) => (
                <li key={p}>
                  <Icon name="check" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="body">
              Prefer email? Write to <a href={`mailto:${INBOX}`}>{INBOX}</a>.
            </p>
          </div>
          <div className="cell">
            <TalkToSalesForm inbox={INBOX} />
          </div>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div className="split top">
          <div className="cell txt">
            <span className="eb">
              <i></i>Why we built it
            </span>
            <h2 className="dt h3">Placements shouldn&apos;t run on spreadsheets</h2>
          </div>
          <div className="cell txt">
            <p className="body" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Hey there,
            </p>
            <p className="body">
              Most Indian colleges still run placements on a shared spreadsheet, a WhatsApp group for every drive, and one
              placement officer who knows where everything stands. It works until a NIRF submission needs three years of
              placement data with proof, or a recruiter asks for an eligibility list by end of day.
            </p>
            <p className="body">
              TalentSnaps puts drives, eligibility, round-by-round results and offer letters on one student record, so the
              placement cell, students and recruiters all see the same thing. We set it up with your team, import your data
              and train your staff ourselves.
            </p>
            <p className="body">Tell us how you run placements today. We&apos;d like to build the next season with you.</p>
            <p className="body" style={{ marginTop: 8 }}>
              <strong style={{ color: "var(--accent)" }}>The TalentSnaps team</strong>
              <br />
              Built in Coimbatore
            </p>
          </div>
        </div>
      </div>
    </CampusShell>
  );
}
