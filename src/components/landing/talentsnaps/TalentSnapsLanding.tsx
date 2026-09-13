"use client";

import "@/styles/talentsnaps-landing.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView, useReducedMotion, animate as fmAnimate } from "framer-motion";
import { HeroScene, LandscapeArt } from "./MountainScene";
import { revealUp, revealEase } from "../reveal";
import { RevealHeading } from "../RevealHeading";
import { TiltCard } from "../TiltCard";
import { MagneticButton } from "../MagneticButton";

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

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do we need a technical team to run this?",
    a: "No. Your existing placement staff run it. Setup, import and training are done with you, and support stays available through placement season.",
  },
  {
    q: "Can we bring our old placement data in?",
    a: "Yes. We import your existing student, drive and offer letter records during onboarding, so nothing has to be re-entered by hand.",
  },
  {
    q: "Does it work for arts and science, or only engineering?",
    a: "Every department. Drives, eligibility rules and reports work the same way regardless of stream — commerce, arts, science or engineering.",
  },
  {
    q: "How does offer letter verification actually work?",
    a: "The placement cell reviews the uploaded letter once and marks it verified. That verification, and who signed off on it, is kept with the letter forever.",
  },
  {
    q: "Will this help with NIRF and NAAC?",
    a: "Yes — placement percentage, median salary and higher studies figures are held as a rolling three year set, exportable in the format your submission needs.",
  },
  {
    q: "What happens to our data if we stop using TalentSnaps?",
    a: "You can export everything — students, drives, offers and reports — before closing your account. We don't hold your data hostage.",
  },
];

type FooterItem = string | { label: string; href: string };

const FOOTER_COLS: { head: string; items: FooterItem[] }[] = [
  { head: "MODULES", items: ["Drives", "Applications", "Screening", "Selection", "Offer Letters"] },
  { head: "ALSO INSIDE", items: ["Aptitude", "Training Tracking", "Reports", "Skill Report"] },
  { head: "FOR COLLEGES", items: ["NIRF Data Export", "Accreditation Reports", "Onboarding", "Support"] },
  { head: "COMPANY", items: ["About Us", "Partner Colleges", "Careers", "Contact"] },
  {
    head: "LEGAL",
    items: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Data Protection", href: "/data-protection" },
    ],
  },
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

// Verified-seal badge: a scalloped rosette (12 overlapping bumps around a
// core disc) with a checkmark, rather than a plain circle — reads as
// "certified" the way an award seal does. Pops in with a spring once the
// rail bars ahead of it have filled.
function VerifiedBadge({ size = 30, animate: shouldAnimate = false }: IconProps & { animate?: boolean }) {
  const bumps = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    // Rounded to a fixed precision so the server- and client-rendered
    // attribute strings match exactly — raw Math.cos/sin doubles can
    // stringify with a trailing-digit difference between JS engines,
    // which React flags as a hydration mismatch.
    return { cx: Math.round((16 + Math.cos(angle) * 10) * 1000) / 1000, cy: Math.round((16 + Math.sin(angle) * 10) * 1000) / 1000 };
  });
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      initial={shouldAnimate ? { scale: 0, rotate: -35 } : false}
      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.9 }}
    >
      {bumps.map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill="var(--ts-green)" />
      ))}
      <circle cx="16" cy="16" r="11" fill="var(--ts-green)" />
      <path d="M10.8 16.3l3.4 3.4l7-7.2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/* ------------------------------------------------------------------ *
 * Small motion helpers local to this page.
 * ------------------------------------------------------------------ */

// A bar that grows from 0 to its target width/height once scrolled into
// view, instead of just appearing pre-filled — used for every progress /
// funnel bar on the page.
function GrowBar({
  axis = "width",
  target,
  color,
  className,
  delay = 0,
  style,
}: {
  axis?: "width" | "height";
  target: string;
  color?: string;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const dim = axis === "width" ? "width" : "height";
  return (
    <motion.div
      className={className}
      style={{ ...style, background: color }}
      initial={reduceMotion ? false : { [dim]: 0 }}
      whileInView={{ [dim]: target }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: revealEase }}
    />
  );
}

// Animates a leading number up to its target value once in view. Handles
// labels like "48,246", "60 of 100" and "3 people" by counting only the
// leading numeric run and leaving the rest of the string static.
function CountUpStat({ value }: { value: string }) {
  const match = value.match(/^([\d,]+)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(match ? "0" : value);

  useEffect(() => {
    if (!match || !inView) return;
    const target = Number(match[1].replace(/,/g, ""));
    if (reduceMotion) {
      setDisplay(match[1]);
      return;
    }
    const controls = fmAnimate(0, target, {
      duration: 1.4,
      ease: revealEase,
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString("en-IN")),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <span ref={ref}>
      {display}
      {match ? match[2] : ""}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function Hero() {
  return (
    <header className="ts-wrap ts-hero" id="ts-dash">
      <motion.span className="ts-chip" {...revealUp(0, 14)}>
        <i />Built in Coimbatore, for Indian colleges
      </motion.span>
      <RevealHeading as="h1" delay={0.08}>
        The complete placement suite<br />for your college.
      </RevealHeading>
      <motion.p className="ts-lede" {...revealUp(0.18, 16)}>
        Drives, applications, screening, selection status, offer letters, aptitude and NIRF
        reporting. Eight modules on one student record, so nothing is entered twice and nothing
        is chased twice.
      </motion.p>
      <motion.div className="ts-row" {...revealUp(0.28, 16)}>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-btn-p">Get started free</button>
        </MagneticButton>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-btn-g">Talk to our team</button>
        </MagneticButton>
      </motion.div>
      <motion.span className="ts-fine" {...revealUp(0.36, 10)}>
        No credit card needed · Set up in one placement season
      </motion.span>
    </header>
  );
}

function Dashboard() {
  return (
    <motion.div className="ts-shot" {...revealUp(0.15, 36)}>
      <div className="ts-chrome">
        <div className="ts-cl"><s /><s /><s />Nirmala College for Women · Placement Cell</div>
        <div className="ts-cr">2026–27 <b /></div>
      </div>

      <div className="ts-dashgrid">
        <div className="ts-side">
          <span className="ts-k">MENU</span>
          {SIDEBAR.map((item, i) => (
            <a key={item} className={i === 0 ? "ts-on" : undefined}><i />{item}</a>
          ))}
        </div>

        <div className="ts-main">
          <div className="ts-mh">
            <div><b>Placement overview</b><span>Updated today, 9:40 AM</span></div>
            <div className="ts-seg">
              <span className="ts-on">All departments</span><span>CS</span><span>Commerce</span>
            </div>
          </div>

          <div className="ts-kpis">
            {KPIS.map((k, i) => (
              <motion.div
                className="ts-kpi" key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: revealEase }}
              >
                <s style={{ background: k.accent }} />
                <em>{k.label}</em>
                <strong>{k.value}</strong>
                <small>{k.note}</small>
              </motion.div>
            ))}
          </div>

          <div className="ts-panels">
            <div className="ts-panel">
              <b>Placed by department</b>
              <div className="ts-bars">
                {DEPARTMENTS.map(({ dept, placed, total }, i) => (
                  <div key={dept}>
                    <em>{placed}</em>
                    <div className="ts-tr" style={{ height: `${(total / TALLEST) * PLOT_SHARE * 100}%` }}>
                      <GrowBar axis="height" target={`${(placed / total) * 100}%`} className="ts-fl" delay={0.6 + i * 0.06} />
                    </div>
                    <small>{dept}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="ts-panel">
              <div className="ts-phead">
                <b style={{ fontSize: 13 }}>Recent drives</b>
                <a>View all</a>
              </div>
              {DRIVES.map((d, i) => (
                <motion.div
                  className="ts-drow" key={d.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.06, ease: revealEase }}
                >
                  <div><b>{d.name}</b><span>{d.detail}</span></div>
                  <span className={`ts-tag ts-${d.tone}`}>{d.stage}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Modules() {
  return (
    <section className="ts-wrap ts-sec" id="ts-modules">
      <div className="ts-center">
        <RevealHeading as="h2">Eight modules. One student record.</RevealHeading>
        <motion.p {...revealUp(0.1)}>
          Every module writes to the same record, so a student applying in August and collecting
          an offer letter in March is one row, not six.
        </motion.p>
      </div>

      <div className="ts-flowlabel">The drive path</div>
      <div className="ts-flow">
        <motion.div
          className="ts-flow-progress"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease: revealEase }}
        />
        <span className="ts-pulse" aria-hidden="true" />
        <span className="ts-pulse" aria-hidden="true" />
        {DRIVE_PATH.map(({ title, copy, icon: Icon }, i) => (
          <motion.div
            className="ts-step" key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: revealEase }}
          >
            <div className="ts-node">
              <span className="ts-num">{i + 1}</span>
              <Icon />
            </div>
            <div className="ts-txt"><h3>{title}</h3><p>{copy}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="ts-flowlabel">Running alongside</div>
      <div className="ts-alongside">
        {ALONGSIDE.map(({ title, copy, accent, icon: Icon }, i) => (
          <motion.div
            key={title}
            {...revealUp(i * 0.1, 16)}
          >
            <TiltCard maxTilt={5} className="ts-along">
              <span className="ts-ic" style={{ background: accent }}><Icon size={20} /></span>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </TiltCard>
          </motion.div>
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
    <section className="ts-wrap ts-feat">
      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: "var(--ts-green)" }}>Drives and applications</span>
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
      </motion.div>

      <motion.div
        className="ts-card"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>New drive</b><span>Zoho Corporation · Software Engineer Trainee</span></div>
          <button className="ts-btn ts-btn-p" style={{ padding: "8px 14px", fontSize: 12.5 }}>Publish</button>
        </div>
        <span className="ts-k">Eligibility</span>
        <div className="ts-chips" style={{ marginTop: 9 }}>
          {["B.Sc CS", "B.Sc IT", "Final year", "CGPA ≥ 6.5", "No backlog"].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="ts-fun">
          {funnel.map(([label, count, width, color], i) => (
            <div key={label}>
              <div className="ts-lab"><span>{label}</span><b>{count}</b></div>
              <div className="ts-tr"><GrowBar target={width} color={color} className="ts-fl" delay={0.2 + i * 0.1} /></div>
            </div>
          ))}
        </div>
      </motion.div>
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
    <section className="ts-wrap ts-feat ts-rev">
      <motion.div
        className="ts-card"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>Offer letters</b><span>Zoho Corporation · 2026–27</span></div>
          <b style={{ color: "var(--ts-green)", fontSize: 15.5 }}>42 of 44</b>
        </div>
        <div className="ts-fun">
          <div className="ts-tr" style={{ height: 10 }}>
            <GrowBar target="95%" color="var(--ts-green)" className="ts-fl" style={{ height: 10 }} delay={0.2} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {people.map(([name, reg, status, tone], i) => (
            <motion.div
              className="ts-drow" key={reg} style={i === 0 ? { borderTop: 0 } : undefined}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: revealEase }}
            >
              <div><b style={{ fontSize: 13.5 }}>{name}</b><span>{reg}</span></div>
              <span className={`ts-tag ts-${tone}`}>{status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: "var(--ts-teal)" }}>Offer letter vault</span>
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
      </motion.div>
    </section>
  );
}

function SkillReport() {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, margin: "-100px" });
  const bars = ["ts-on", "ts-on", "ts-on", ""];

  return (
    <section className="ts-wrap ts-feat" id="ts-report">
      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: "var(--ts-leaf)" }}>Skill Report</span>
        <h2>Four years, recorded while they happen.</h2>
        <p>
          Training, courses, projects, hackathons, internships and certifications go onto the same
          record as the placement journey. By final year the student does not write a resume from
          memory, they export a record the college has already verified.
        </p>
      </motion.div>

      <motion.div
        ref={cardRef}
        className="ts-card"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>Skill Report</b><span>Keerthana R · B.Sc Computer Science · 2023–27</span></div>
        </div>
        <div className="ts-rail">
          {bars.map((state, i) => (
            <motion.s
              key={i}
              className={state}
              initial={{ scaleX: 0 }}
              animate={cardInView && state === "ts-on" ? { scaleX: 1 } : undefined}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.15, ease: revealEase }}
            />
          ))}
          <b><VerifiedBadge animate={cardInView} /></b>
        </div>
        <div className="ts-rlab">
          {["Year 1", "Year 2", "Year 3", "Year 4"].map((y) => <span key={y}>{y}</span>)}
        </div>
        {SKILL_ROWS.map(([k, v], i) => (
          <motion.div
            className="ts-drow" key={k}
            initial={{ opacity: 0 }}
            animate={cardInView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.4, delay: 1.1 + i * 0.06 }}
          >
            <span style={{ fontSize: 14, color: "var(--ts-body)" }}>{k}</span>
            <b style={{ fontSize: 14 }}>{v}</b>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function ExportCard() {
  return (
    <motion.div className="ts-export" {...revealUp(0.15, 24)}>
      <div className="ts-eh">
        <div>
          <b>NIRF export 2026–27</b>
          <span>Three year rolling · 1,232 offer letters attached</span>
        </div>
        <span className="ts-tag ts-t-ok">Ready</span>
      </div>
      <div className="ts-row"><span>Placement percentage</span><b>59.8%</b></div>
      <div className="ts-row"><span>Median salary</span><b>₹4,20,000</b></div>
      <div className="ts-row"><span>Higher studies</span><b>214 students</b></div>
      <button className="ts-cta">Download the submission file</button>
    </motion.div>
  );
}

function DataBand() {
  return (
    <section className="ts-band" id="ts-data">
      <div className="ts-wrap">
        <div className="ts-center">
          <span className="ts-eyebrow" style={{ color: "var(--ts-green)" }}>Data you can hand over</span>
          <RevealHeading as="h2" className="ts-mw-17ch">Every record your college creates stays your college&apos;s.</RevealHeading>
          <motion.p style={{ maxWidth: "66ch", fontSize: 17, lineHeight: 1.72 }} {...revealUp(0.1)}>
            Role based access so each person sees what they should, an audit trail behind every
            verification, and a full export whenever you want one. Nothing is locked in, and
            nothing has to be rebuilt at submission time.
          </motion.p>
        </div>

        <div className="ts-spec">
          {SPEC.map(({ term, copy, evLabel, evValue }, i) => (
            <motion.div key={term} {...revealUp(i * 0.08, 14)}>
              <span className="ts-lab">{term}</span>
              <p>{copy}</p>
              <span className="ts-ev">
                {evLabel}<br />
                <b>
                  {evValue.map((line, j) => (
                    <span key={line}>{j > 0 && <br />}{line}</span>
                  ))}
                </b>
              </span>
            </motion.div>
          ))}
        </div>

        <TiltCard maxTilt={4} className="ts-export-tilt">
          <ExportCard />
        </TiltCard>
      </div>
    </section>
  );
}

function Numbers() {
  return (
    <section className="ts-wrap">
      <div className="ts-nums">
        {NUMBERS.map(({ big, small }, i) => (
          <motion.div key={big} {...revealUp(i * 0.1, 14)}>
            <strong><CountUpStat value={big} /></strong>
            <p>{small}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="ts-wrap ts-sec" id="ts-faq">
      <div className="ts-center"><RevealHeading as="h2">Questions we get in the first meeting</RevealHeading></div>
      <div className="ts-faq">
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={q} {...revealUp(Math.min(i * 0.05, 0.3), 10)}>
              <button
                type="button"
                className="ts-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {q}
                <motion.em animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: revealEase }}>+</motion.em>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: revealEase }}
                    style={{ overflow: "hidden" }}
                  >
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="ts-ctab">
      <RevealHeading as="h2">Set up your placement cell for this season.</RevealHeading>
      <motion.p {...revealUp(0.1)}>
        We will walk your team through a drive you have already run, so you can see exactly what
        changes.
      </motion.p>
      <motion.div className="ts-row" {...revealUp(0.2)}>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-w">Get started free</button>
        </MagneticButton>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-o">Talk to our team</button>
        </MagneticButton>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="ts-wrap">
        <motion.div className="ts-ftop" {...revealUp(0, 16)}>
          <div className="ts-fb">
            <div className="ts-brand"><i />TalentSnaps</div>
            <p>
              The placement suite for Indian colleges.<br />
              Built in Coimbatore, for Tier 3 and growing Tier 2 institutions.
            </p>
          </div>
          <div className="ts-contact">
            <b>Talk to us about your next placement season</b>
            <div className="ts-f">
              <input id="ts-femail" type="email" placeholder="Your college email" aria-label="Your college email" />
              <MagneticButton strength={0.2}>
                <button className="ts-btn ts-btn-p" style={{ padding: "12px 20px", fontSize: 14 }}>Book a demo</button>
              </MagneticButton>
            </div>
            <small>hello@talentsnaps.in · Coimbatore, Tamil Nadu</small>
          </div>
        </motion.div>

        <div className="ts-fcols">
          {FOOTER_COLS.map(({ head, items }) => (
            <div key={head}>
              <h4>{head}</h4>
              <ul>
                {items.map((i) =>
                  typeof i === "string" ? (
                    <li key={i}>{i}</li>
                  ) : (
                    <li key={i.href}><Link href={i.href}>{i.label}</Link></li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="ts-fbar">
          <span>© 2026 TalentSnaps. All rights reserved.</span>
          <div className="ts-m">
            <span>Offer letters verified by the placement cell</span>
            <span>NIRF ready, three year rolling data</span>
            <span>Your data stays yours</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ClosingScene() {
  return (
    <motion.div
      className="ts-scene ts-closing-scene"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1 }}
    >
      <LandscapeArt />
    </motion.div>
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
      <ClosingScene />
    </div>
  );
}
