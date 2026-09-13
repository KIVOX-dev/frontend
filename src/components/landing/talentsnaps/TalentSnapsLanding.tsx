"use client";

import "@/styles/talentsnaps-landing.css";
import type { ReactNode } from "react";
import { HeroScene, BandScene } from "./MountainScene";

/* ------------------------------------------------------------------ *
 * Content. Everything the page says lives here, so copy changes never
 * mean touching markup.
 * ------------------------------------------------------------------ */

const SIDEBAR = [
  "Dashboard", "Drives", "Students", "Companies",
  "Screening", "Offer Letters", "Aptitude", "Reports",
];

const KPIS = [
  { label: "Students on record", value: "2,148", note: "+312 this year", accent: "var(--ts-green)" },
  { label: "Active drives", value: "6", note: "2 closing this week", accent: "var(--ts-leaf)" },
  { label: "Placed", value: "1,284", note: "59.8% of final year", accent: "var(--ts-teal)" },
  { label: "Offer letters verified", value: "96%", note: "1,232 of 1,284", accent: "var(--ts-olive)" },
];

// placed / total per department. Bars are drawn as a share of the tallest total.
const DEPARTMENTS = [
  { dept: "CS", placed: 214, total: 246 },
  { dept: "IT", placed: 186, total: 210 },
  { dept: "B.Com", placed: 168, total: 232 },
  { dept: "BBA", placed: 96, total: 140 },
  { dept: "Maths", placed: 74, total: 120 },
  { dept: "English", placed: 52, total: 96 },
];
const TALLEST = Math.max(...DEPARTMENTS.map((d) => d.total));
const PLOT_SHARE = 0.8; // the tallest bar fills 80% of the plot, leaving room for its label

const DRIVES = [
  { name: "Zoho Corporation", detail: "Offers 42/44", stage: "Selected 44", tone: "t-ok" },
  { name: "Cognizant", detail: "48 in process", stage: "Round 2 of 3", tone: "t-go" },
  { name: "KGiSL", detail: "214 eligible", stage: "Applications open", tone: "t-go" },
  { name: "Bosch", detail: "Offers 18/18", stage: "Closed", tone: "t-ok" },
  { name: "Wipro", detail: "61 cleared", stage: "Screening", tone: "t-nu" },
];

const DRIVE_PATH: { title: string; copy: string; icon: IconComponent }[] = [
  { title: "Drives", copy: "Announced to exactly the students who qualify", icon: Megaphone },
  { title: "Applications", copy: "Eligibility checked the moment a student applies", icon: DocCheck },
  { title: "Screening", copy: "Round by round, with live status for every student", icon: Funnel },
  { title: "Selection", copy: "Who is in and who is out, recorded on the day", icon: PersonCheck },
  { title: "Offer Letters", copy: "Requested, uploaded and verified once, then kept", icon: SealedMail },
];

const ALONGSIDE: { title: string; accent: string; icon: IconComponent; copy: string }[] = [
  { title: "Aptitude", accent: "var(--ts-teal)", icon: Timer,
    copy: "Run tests inside the platform, with section wise reports at student, class and department level." },
  { title: "Reports", accent: "var(--ts-leaf)", icon: ReportDoc,
    copy: "NIRF, NAAC and management reviews generated from data that is already structured." },
  { title: "Skill Report", accent: "var(--ts-olive)", icon: Badge,
    copy: "The four year record, filling continuously from first year training to the final offer letter." },
];

const SPEC = [
  {
    term: "NIRF ready",
    copy: "Placement, higher studies and median salary held as a rolling three year set, each figure carrying the offer letters that back it.",
    evLabel: "rolling years",
    evValue: ["2024 · 2025 · 2026"],
  },
  {
    term: "Export any time",
    copy: "Students, drives, offers and reports leave as files your office can open without us in the room.",
    evLabel: "formats",
    evValue: [".xlsx · .csv · .pdf"],
  },
  {
    term: "Role based access",
    copy: "Four views of the same record, so nobody sees more than their job needs and nobody shares a login.",
    evLabel: "roles",
    evValue: ["principal · placement", "coordinator · student"],
  },
  {
    term: "Audit trail",
    copy: "Every verification carries a name and a timestamp, so a disputed record can always be traced back to the person who signed it off.",
    evLabel: "last entry",
    evValue: ["19.08.26 · 14:22", "offer letter verified", "R. Menon, Placement Cell"],
  },
];

const NUMBERS = [
  { big: "48,246", small: "colleges in India, most of them running placements on spreadsheets" },
  { big: "7,692", small: "institutions submitted to NIRF in 2025, up 217 percent since 2016" },
  { big: "60 of 100", small: "Graduation Outcomes marks that need placement and salary data with proof" },
  { big: "3 people", small: "the size of a typical placement team in a Tier 3 college" },
];

const FAQS: { q: string; a?: string }[] = [
  {
    q: "Do we need a technical team to run this?",
    a: "No. Your existing placement staff run it. Setup, import and training are done with you, and support stays available through placement season.",
  },
  { q: "Can we bring our old placement data in?" },
  { q: "Does it work for arts and science, or only engineering?" },
  { q: "How does offer letter verification actually work?" },
  { q: "Will this help with NIRF and NAAC?" },
  { q: "What happens to our data if we stop using TalentSnaps?" },
];

const FOOTER_COLS = [
  { head: "MODULES", items: ["Drives", "Applications", "Screening", "Selection", "Offer Letters"] },
  { head: "ALSO INSIDE", items: ["Aptitude", "Training Tracking", "Reports", "Skill Report"] },
  { head: "FOR COLLEGES", items: ["NIRF Data Export", "Accreditation Reports", "Onboarding", "Support"] },
  { head: "COMPANY", items: ["About Us", "Partner Colleges", "Careers", "Contact"] },
  { head: "LEGAL", items: ["Privacy Policy", "Terms of Service", "Data Protection"] },
];

const SKILL_ROWS: [string, string][] = [
  ["Training programmes", "14"],
  ["Projects built", "6"],
  ["Hackathons", "3"],
  ["Internships", "2"],
  ["Certifications", "9"],
  ["Placed at", "Zoho Corporation"],
];

/* ------------------------------------------------------------------ *
 * Icons. Stroke only, sized by the `size` prop, coloured by currentColor.
 * ------------------------------------------------------------------ */

type IconProps = { size?: number };
type IconComponent = (props: IconProps) => ReactNode;

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Megaphone(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </Svg>
  );
}
function DocCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9.5 14l2 2 3.5-4" />
    </Svg>
  );
}
function Funnel(p: IconProps) {
  return <Svg {...p}><path d="M4 5h16l-6 7v6l-4 2v-8Z" /></Svg>;
}
function PersonCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M4 20c0-3.2 2.7-5 6-5 1 0 2 .2 2.8.5" />
      <path d="M15 17.5l2 2 4-4.5" />
    </Svg>
  );
}
function SealedMail(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" />
      <circle cx="18.5" cy="17" r="3.2" fill="var(--ts-surface)" />
      <path d="M17 17l1.1 1.2 2-2.4" />
    </Svg>
  );
}
function Timer(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M9 2h6" />
    </Svg>
  );
}
function ReportDoc(p: IconProps) {
  return (
    <svg width={p.size ?? 21} height={p.size ?? 21} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4" />
      <path d="M9 17.5h6.5" /><path d="M10 17.5V14" /><path d="M12.5 17.5V11" /><path d="M15 17.5v-5" />
    </svg>
  );
}
function Badge(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function Hero() {
  return (
    <header className="wrap hero" id="ts-dash">
      <span className="chip"><i />Built in Coimbatore, for Indian colleges</span>
      <h1>The complete placement suite<br />for your college.</h1>
      <p className="lede">
        Drives, applications, screening, selection status, offer letters, aptitude and NIRF
        reporting. Eight modules on one student record, so nothing is entered twice and nothing
        is chased twice.
      </p>
      <div className="row">
        <button className="btn btn-p">Get started free</button>
        <button className="btn btn-g">Talk to our team</button>
      </div>
      <span className="fine">No credit card needed · Set up in one placement season</span>
    </header>
  );
}

function Dashboard() {
  return (
    <div className="shot">
      <div className="chrome">
        <div className="l"><s /><s /><s />Nirmala College for Women · Placement Cell</div>
        <div className="r">2026–27 <b /></div>
      </div>

      <div className="dash">
        <div className="side">
          <span className="k">MENU</span>
          {SIDEBAR.map((item, i) => (
            <a key={item} className={i === 0 ? "on" : undefined}><i />{item}</a>
          ))}
        </div>

        <div className="main">
          <div className="mh">
            <div><b>Placement overview</b><span>Updated today, 9:40 AM</span></div>
            <div className="seg">
              <span className="on">All departments</span><span>CS</span><span>Commerce</span>
            </div>
          </div>

          <div className="kpis">
            {KPIS.map((k) => (
              <div className="kpi" key={k.label}>
                <s style={{ background: k.accent }} />
                <em>{k.label}</em>
                <strong>{k.value}</strong>
                <small>{k.note}</small>
              </div>
            ))}
          </div>

          <div className="panels">
            <div className="panel">
              <b>Placed by department</b>
              <div className="bars">
                {DEPARTMENTS.map(({ dept, placed, total }) => (
                  <div key={dept}>
                    <em>{placed}</em>
                    <div className="tr" style={{ height: `${(total / TALLEST) * PLOT_SHARE * 100}%` }}>
                      <div className="fl" style={{ height: `${(placed / total) * 100}%` }} />
                    </div>
                    <small>{dept}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="phead">
                <b style={{ fontSize: 13 }}>Recent drives</b>
                <a>View all</a>
              </div>
              {DRIVES.map((d) => (
                <div className="drow" key={d.name}>
                  <div><b>{d.name}</b><span>{d.detail}</span></div>
                  <span className={`tag ${d.tone}`}>{d.stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modules() {
  return (
    <section className="wrap sec" id="ts-modules">
      <div className="center">
        <h2>Eight modules. One student record.</h2>
        <p>
          Every module writes to the same record, so a student applying in August and collecting
          an offer letter in March is one row, not six.
        </p>
      </div>

      <div className="flowlabel">The drive path</div>
      <div className="flow">
        {DRIVE_PATH.map(({ title, copy, icon: Icon }, i) => (
          <div className="step" key={title}>
            <div className="node">
              <span className="num">{i + 1}</span>
              <Icon />
            </div>
            <div className="txt"><h3>{title}</h3><p>{copy}</p></div>
          </div>
        ))}
      </div>

      <div className="flowlabel">Running alongside</div>
      <div className="alongside">
        {ALONGSIDE.map(({ title, copy, accent, icon: Icon }) => (
          <div className="along" key={title}>
            <span className="ic" style={{ background: accent }}><Icon size={20} /></span>
            <div><h3>{title}</h3><p>{copy}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DrivesFeature() {
  const funnel: [string, number, string, string][] = [
    ["Eligible", 214, "100%", "var(--ts-green)"],
    ["Applied", 148, "69%", "var(--ts-leaf)"],
    ["Cleared aptitude", 61, "28%", "var(--ts-teal)"],
    ["Selected", 44, "20%", "var(--ts-olive)"],
  ];
  return (
    <section className="wrap feat">
      <div className="copy">
        <span className="eyebrow" style={{ color: "var(--ts-green)" }}>Drives and applications</span>
        <h2>Announce a drive to exactly the students who qualify.</h2>
        <p>
          Set the rule once. Department, year, CGPA, backlogs, any criterion the recruiter has.
          The drive reaches only eligible students, and the ineligible list stops being
          somebody&apos;s evening job.
        </p>
        <ul>
          {["Students apply from their own dashboard",
            "Eligibility checked at the moment of applying",
            "Every application timestamped against the drive"].map((line) => (
            <li key={line}><i style={{ background: "var(--ts-green)" }} />{line}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="ch">
          <div><b>New drive</b><span>Zoho Corporation · Software Engineer Trainee</span></div>
          <button className="btn btn-p" style={{ padding: "8px 14px", fontSize: 12.5 }}>Publish</button>
        </div>
        <span className="k">Eligibility</span>
        <div className="chips" style={{ marginTop: 9 }}>
          {["B.Sc CS", "B.Sc IT", "Final year", "CGPA ≥ 6.5", "No backlog"].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="fun">
          {funnel.map(([label, count, width, color]) => (
            <div key={label}>
              <div className="lab"><span>{label}</span><b>{count}</b></div>
              <div className="tr"><div className="fl" style={{ width, background: color }} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferLettersFeature() {
  const people: [string, string, string, string][] = [
    ["Keerthana R", "23UCS041", "Verified", "t-ok"],
    ["Arun Prakash M", "23UCS017", "Verified", "t-ok"],
    ["Divya Bharathi S", "23UIT008", "Uploaded", "t-go"],
    ["Naveen Kumar T", "23UCS029", "Reminder sent", "t-nu"],
  ];
  return (
    <section className="wrap feat rev">
      <div className="card">
        <div className="ch">
          <div><b>Offer letters</b><span>Zoho Corporation · 2026–27</span></div>
          <b style={{ color: "var(--ts-green)", fontSize: 15.5 }}>42 of 44</b>
        </div>
        <div className="fun">
          <div className="tr" style={{ height: 10 }}>
            <div className="fl" style={{ height: 10, width: "95%", background: "var(--ts-green)" }} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {people.map(([name, reg, status, tone], i) => (
            <div className="drow" key={reg} style={i === 0 ? { borderTop: 0 } : undefined}>
              <div><b style={{ fontSize: 13.5 }}>{name}</b><span>{reg}</span></div>
              <span className={`tag ${tone}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="copy">
        <span className="eyebrow" style={{ color: "var(--ts-teal)" }}>Offer letter vault</span>
        <h2>The offer letter is requested before the student walks away.</h2>
        <p>
          The moment a student is marked selected, the upload is asked for. Reminders go out on
          their own. The placement cell verifies once, and that letter is attached to the drive,
          the company and the year forever.
        </p>
        <ul>
          {["No WhatsApp collection drives in March",
            "Counted straight into NIRF and NAAC reporting",
            "Proof stays with the institution, not in a chat"].map((line) => (
            <li key={line}><i style={{ background: "var(--ts-teal)" }} />{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SkillReport() {
  return (
    <section className="wrap feat" id="ts-report">
      <div className="copy">
        <span className="eyebrow" style={{ color: "var(--ts-leaf)" }}>Skill Report</span>
        <h2>Four years, recorded while they happen.</h2>
        <p>
          Training, courses, projects, hackathons, internships and certifications go onto the same
          record as the placement journey. By final year the student does not write a resume from
          memory, they export a record the college has already verified.
        </p>
      </div>

      <div className="card">
        <div className="ch">
          <div><b>Skill Report</b><span>Keerthana R · B.Sc Computer Science · 2023–27</span></div>
        </div>
        <div className="rail">
          <s className="on" /><s className="on" /><s className="on" /><s />
          <b>✓</b>
        </div>
        <div className="rlab">
          {["Year 1", "Year 2", "Year 3", "Year 4"].map((y) => <span key={y}>{y}</span>)}
        </div>
        {SKILL_ROWS.map(([k, v]) => (
          <div className="drow" key={k}>
            <span style={{ fontSize: 14, color: "var(--ts-body)" }}>{k}</span>
            <b style={{ fontSize: 14 }}>{v}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExportCard() {
  return (
    <div className="export">
      <div className="eh">
        <div>
          <b>NIRF export 2026–27</b>
          <span>Three year rolling · 1,232 offer letters attached</span>
        </div>
        <span className="tag t-ok">Ready</span>
      </div>
      <div className="row"><span>Placement percentage</span><b>59.8%</b></div>
      <div className="row"><span>Median salary</span><b>₹4,20,000</b></div>
      <div className="row"><span>Higher studies</span><b>214 students</b></div>
      <button className="cta">Download the submission file</button>
    </div>
  );
}

function DataBand() {
  return (
    <section className="band" id="ts-data">
      <div className="wrap">
        <div className="center">
          <span className="eyebrow" style={{ color: "var(--ts-green)" }}>Data you can hand over</span>
          <h2 style={{ maxWidth: "17ch" }}>Every record your college creates stays your college&apos;s.</h2>
          <p style={{ maxWidth: "66ch", fontSize: 17, lineHeight: 1.72 }}>
            Role based access so each person sees what they should, an audit trail behind every
            verification, and a full export whenever you want one. Nothing is locked in, and
            nothing has to be rebuilt at submission time.
          </p>
        </div>

        <div className="spec">
          {SPEC.map(({ term, copy, evLabel, evValue }) => (
            <div key={term}>
              <span className="lab">{term}</span>
              <p>{copy}</p>
              <span className="ev">
                {evLabel}<br />
                <b>
                  {evValue.map((line, i) => (
                    <span key={line}>{i > 0 && <br />}{line}</span>
                  ))}
                </b>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Numbers() {
  return (
    <section className="wrap">
      <div className="nums">
        {NUMBERS.map(({ big, small }) => (
          <div key={big}><strong>{big}</strong><p>{small}</p></div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="wrap sec" id="ts-faq">
      <div className="center"><h2>Questions we get in the first meeting</h2></div>
      <div className="faq">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <div className="q">{q}<em>{a ? "–" : "+"}</em></div>
            {a && <p>{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="ctab">
      <h2>Set up your placement cell for this season.</h2>
      <p>
        We will walk your team through a drive you have already run, so you can see exactly what
        changes.
      </p>
      <div className="row">
        <button className="btn w">Get started free</button>
        <button className="btn o">Talk to our team</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <BandScene className="footer-scene">
      <ExportCard />
      <footer>
        <div className="wrap">
          <div className="ftop">
            <div className="fb">
              <div className="brand"><i />TalentSnaps</div>
              <p>
                The placement suite for Indian colleges.<br />
                Built in Coimbatore, for Tier 3 and growing Tier 2 institutions.
              </p>
            </div>
            <div className="contact">
              <b>Talk to us about your next placement season</b>
              <div className="f">
                <input id="ts-femail" type="email" placeholder="Your college email" aria-label="Your college email" />
                <button className="btn btn-p" style={{ padding: "12px 20px", fontSize: 14 }}>Book a demo</button>
              </div>
              <small>hello@talentsnaps.in · Coimbatore, Tamil Nadu</small>
            </div>
          </div>

          <div className="fcols">
            {FOOTER_COLS.map(({ head, items }) => (
              <div key={head}>
                <h4>{head}</h4>
                <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>

          <div className="fbar">
            <span>© 2026 TalentSnaps. All rights reserved.</span>
            <div className="m">
              <span>Offer letters verified by the placement cell</span>
              <span>NIRF ready, three year rolling data</span>
              <span>Your data stays yours</span>
            </div>
          </div>
        </div>
      </footer>
    </BandScene>
  );
}

/* ------------------------------------------------------------------ */

export default function TalentSnapsLanding() {
  return (
    <div className="ts-landing">
      <Hero />
      <HeroScene><Dashboard /></HeroScene>
      <Modules />
      <DrivesFeature />
      <OfferLettersFeature />
      <SkillReport />
      <DataBand />
      <Numbers />
      <Faq />
      <CtaBand />
      <Footer />
    </div>
  );
}
