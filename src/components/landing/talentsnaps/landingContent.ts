// Every piece of copy/sample-data TalentSnapsLanding.tsx renders, pulled out
// of the component so the exact same section markup (Hero, Dashboard,
// Modules, the two alternating feature rows, SkillReport, DataBand, Numbers,
// Faq, CtaBand, Footer) can be reused for a different audience — starting
// with /for-hr — without duplicating ~900 lines of JSX. `ROOT_CONTENT` below
// is the root page's existing copy transcribed verbatim, so passing it (the
// default) changes nothing about the live root page.

export type BarDatum = { label: string; value: number; total: number };
export type RowDatum = { name: string; detail: string; stage: string; tone: string };
export type StepCopy = { title: string; copy: string };
export type SideCardCopy = { title: string; copy: string; accent: string };
export type SpecCard = { term: string; copy: string; evLabel: string; evValue: string[] };
export type NumberStat = { big: string; small: string };
export type FaqItem = { q: string; a: string };
export type FooterItem = string | { label: string; href: string };
export type FooterCol = { head: string; items: FooterItem[] };

export type LandingContent = {
  /** Storm overlay (dark cloud wash + rain) over the hero/closing mountain
      scenes — the monsoon theme established for HR elsewhere this session. */
  monsoon?: boolean;
  hero: {
    chip: string;
    headlineLine1: string;
    headlineLine2: string;
    lede: string;
    ctaPrimary: string;
    ctaSecondary: string;
    fine: string;
  };
  dashboard: {
    chromeTitle: string;
    chromeRight: string;
    sidebar: string[];
    mainTitle: string;
    mainSubtitle: string;
    segments: string[];
    kpis: { label: string; value: string; note: string; accent: string }[];
    panel1Title: string;
    panel1Data: BarDatum[];
    panel2Title: string;
    panel2ViewAll: string;
    panel2Rows: RowDatum[];
  };
  modules: {
    heading: string;
    intro: string;
    pathLabel: string;
    path: StepCopy[];
    alongsideLabel: string;
    alongside: SideCardCopy[];
  };
  feature1: {
    eyebrow: string;
    eyebrowColor: string;
    heading: string;
    body: string;
    bullets: string[];
    cardTitle: string;
    cardSubtitle: string;
    cardCta: string;
    chips: string[];
    funnel: { label: string; count: number; width: string; color: string }[];
  };
  feature2: {
    cardTitle: string;
    cardSubtitle: string;
    cardBig: string;
    progressPct: string;
    rows: [string, string, string, string][];
    eyebrow: string;
    eyebrowColor: string;
    heading: string;
    body: string;
    bullets: string[];
  };
  feature3: {
    eyebrow: string;
    eyebrowColor: string;
    heading: string;
    body: string;
    cardTitle: string;
    cardSubtitle: string;
    railLabels: string[];
    rows: [string, string][];
  };
  dataBand: {
    eyebrow: string;
    heading: string;
    body: string;
    specs: SpecCard[];
    exportTitle: string;
    exportSubtitle: string;
    exportBadge: string;
    exportRows: [string, string][];
    exportCta: string;
  };
  numbers: NumberStat[];
  faq: { heading: string; items: FaqItem[] };
  cta: { heading: string; body: string; primary: string; secondary: string };
  footer: {
    brandLine1: string;
    brandLine2: string;
    contactHeading: string;
    contactEmail: string;
    columns: FooterCol[];
    tagline: string[];
  };
};

export const ROOT_CONTENT: LandingContent = {
  hero: {
    chip: "Built in Coimbatore, for Indian colleges",
    headlineLine1: "The complete placement suite",
    headlineLine2: "for your college.",
    lede: "Drives, applications, screening, selection status, offer letters, aptitude and NIRF reporting. Eight modules on one student record, so nothing is entered twice and nothing is chased twice.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Talk to our team",
    fine: "No credit card needed · Set up in one placement season",
  },
  dashboard: {
    chromeTitle: "Nirmala College for Women · Placement Cell",
    chromeRight: "2026–27",
    sidebar: ["Dashboard", "Drives", "Students", "Companies", "Screening", "Offer Letters", "Aptitude", "Reports"],
    mainTitle: "Placement overview",
    mainSubtitle: "Updated today, 9:40 AM",
    segments: ["All departments", "CS", "Commerce"],
    kpis: [
      { label: "Students on record", value: "2,148", note: "+312 this year", accent: "var(--ts-green)" },
      { label: "Active drives", value: "6", note: "2 closing this week", accent: "var(--ts-leaf)" },
      { label: "Placed", value: "1,284", note: "59.8% of final year", accent: "var(--ts-teal)" },
      { label: "Offer letters verified", value: "96%", note: "1,232 of 1,284", accent: "var(--ts-olive)" },
    ],
    panel1Title: "Placed by department",
    panel1Data: [
      { label: "CS", value: 214, total: 246 },
      { label: "IT", value: 186, total: 210 },
      { label: "B.Com", value: 168, total: 232 },
      { label: "BBA", value: 96, total: 140 },
      { label: "Maths", value: 74, total: 120 },
      { label: "English", value: 52, total: 96 },
    ],
    panel2Title: "Recent drives",
    panel2ViewAll: "View all",
    panel2Rows: [
      { name: "Zoho Corporation", detail: "Offers 42/44", stage: "Selected 44", tone: "t-ok" },
      { name: "Cognizant", detail: "48 in process", stage: "Round 2 of 3", tone: "t-go" },
      { name: "KGiSL", detail: "214 eligible", stage: "Applications open", tone: "t-go" },
      { name: "Bosch", detail: "Offers 18/18", stage: "Closed", tone: "t-ok" },
      { name: "Wipro", detail: "61 cleared", stage: "Screening", tone: "t-nu" },
    ],
  },
  modules: {
    heading: "Eight modules. One student record.",
    intro: "Every module writes to the same record, so a student applying in August and collecting an offer letter in March is one row, not six.",
    pathLabel: "The drive path",
    path: [
      { title: "Drives", copy: "Announced to exactly the students who qualify" },
      { title: "Applications", copy: "Eligibility checked the moment a student applies" },
      { title: "Screening", copy: "Round by round, with live status for every student" },
      { title: "Selection", copy: "Who is in and who is out, recorded on the day" },
      { title: "Offer Letters", copy: "Requested, uploaded and verified once, then kept" },
    ],
    alongsideLabel: "Running alongside",
    alongside: [
      { title: "Aptitude", accent: "var(--ts-teal)", copy: "Run tests inside the platform, with section wise reports at student, class and department level." },
      { title: "Reports", accent: "var(--ts-leaf)", copy: "NIRF, NAAC and management reviews generated from data that is already structured." },
      { title: "Skill Report", accent: "var(--ts-olive)", copy: "The four year record, filling continuously from first year training to the final offer letter." },
    ],
  },
  feature1: {
    eyebrow: "Drives and applications",
    eyebrowColor: "var(--ts-green)",
    heading: "Announce a drive to exactly the students who qualify.",
    body: "Set the rule once. Department, year, CGPA, backlogs, any criterion the recruiter has. The drive reaches only eligible students, and the ineligible list stops being somebody's evening job.",
    bullets: [
      "Students apply from their own dashboard",
      "Eligibility checked at the moment of applying",
      "Every application timestamped against the drive",
    ],
    cardTitle: "New drive",
    cardSubtitle: "Zoho Corporation · Software Engineer Trainee",
    cardCta: "Publish",
    chips: ["B.Sc CS", "B.Sc IT", "Final year", "CGPA ≥ 6.5", "No backlog"],
    funnel: [
      { label: "Eligible", count: 214, width: "100%", color: "var(--ts-green)" },
      { label: "Applied", count: 148, width: "69%", color: "var(--ts-leaf)" },
      { label: "Cleared aptitude", count: 61, width: "28%", color: "var(--ts-teal)" },
      { label: "Selected", count: 44, width: "20%", color: "var(--ts-olive)" },
    ],
  },
  feature2: {
    cardTitle: "Offer letters",
    cardSubtitle: "Zoho Corporation · 2026–27",
    cardBig: "42 of 44",
    progressPct: "95%",
    rows: [
      ["Keerthana R", "23UCS041", "Verified", "t-ok"],
      ["Arun Prakash M", "23UCS017", "Verified", "t-ok"],
      ["Divya Bharathi S", "23UIT008", "Uploaded", "t-go"],
      ["Naveen Kumar T", "23UCS029", "Reminder sent", "t-nu"],
    ],
    eyebrow: "Offer letter vault",
    eyebrowColor: "var(--ts-teal)",
    heading: "The offer letter is requested before the student walks away.",
    body: "The moment a student is marked selected, the upload is asked for. Reminders go out on their own. The placement cell verifies once, and that letter is attached to the drive, the company and the year forever.",
    bullets: [
      "No WhatsApp collection drives in March",
      "Counted straight into NIRF and NAAC reporting",
      "Proof stays with the institution, not in a chat",
    ],
  },
  feature3: {
    eyebrow: "Skill Report",
    eyebrowColor: "var(--ts-leaf)",
    heading: "Four years, recorded while they happen.",
    body: "Training, courses, projects, hackathons, internships and certifications go onto the same record as the placement journey. By final year the student does not write a resume from memory, they export a record the college has already verified.",
    cardTitle: "Skill Report",
    cardSubtitle: "Keerthana R · B.Sc Computer Science · 2023–27",
    railLabels: ["Year 1", "Year 2", "Year 3", "Year 4"],
    rows: [
      ["Training programmes", "14"],
      ["Projects built", "6"],
      ["Hackathons", "3"],
      ["Internships", "2"],
      ["Certifications", "9"],
      ["Placed at", "Zoho Corporation"],
    ],
  },
  dataBand: {
    eyebrow: "Data you can hand over",
    heading: "Every record your college creates stays your college's.",
    body: "Role based access so each person sees what they should, an audit trail behind every verification, and a full export whenever you want one. Nothing is locked in, and nothing has to be rebuilt at submission time.",
    specs: [
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
    ],
    exportTitle: "NIRF export 2026–27",
    exportSubtitle: "Three year rolling · 1,232 offer letters attached",
    exportBadge: "Ready",
    exportRows: [
      ["Placement percentage", "59.8%"],
      ["Median salary", "₹4,20,000"],
      ["Higher studies", "214 students"],
    ],
    exportCta: "Download the submission file",
  },
  numbers: [
    { big: "48,246", small: "colleges in India, most of them running placements on spreadsheets" },
    { big: "7,692", small: "institutions submitted to NIRF in 2025, up 217 percent since 2016" },
    { big: "60 of 100", small: "Graduation Outcomes marks that need placement and salary data with proof" },
    { big: "3 people", small: "the size of a typical placement team in a Tier 3 college" },
  ],
  faq: {
    heading: "Questions we get in the first meeting",
    items: [
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
    ],
  },
  cta: {
    heading: "Set up your placement cell for this season.",
    body: "We will walk your team through a drive you have already run, so you can see exactly what changes.",
    primary: "Get started free",
    secondary: "Talk to our team",
  },
  footer: {
    brandLine1: "The placement suite for Indian colleges.",
    brandLine2: "Built in Coimbatore, for Tier 3 and growing Tier 2 institutions.",
    contactHeading: "Talk to us about your next placement season",
    contactEmail: "admin@talentsnaps.com · Coimbatore, Tamil Nadu",
    columns: [
      { head: "MODULES", items: ["Drives", "Applications", "Screening", "Selection", "Offer Letters"] },
      { head: "ALSO INSIDE", items: ["Aptitude", "Training Tracking", "Reports", "Skill Report"] },
      { head: "FOR COLLEGES", items: ["NIRF Data Export", "Accreditation Reports", "Onboarding", "Support"] },
      {
        head: "COMPANY",
        items: [
          { label: "About Us", href: "/about-us" },
          { label: "Partner Colleges", href: "/partner-colleges" },
          { label: "Careers", href: "/careers" },
          { label: "Verification", href: "/verification" },
          { label: "Profile Setup", href: "/profile-setup" },
          { label: "Changelog", href: "/changelog" },
          { label: "Contact", href: "#ts-contact-form" },
        ],
      },
      {
        head: "LEGAL",
        items: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms of Service", href: "/terms-of-service" },
          { label: "Data Protection", href: "/data-protection" },
        ],
      },
    ],
    tagline: [
      "Offer letters verified by the placement cell",
      "NIRF ready, three year rolling data",
      "Your data stays yours",
    ],
  },
};

// Student-facing copy, same shape as ROOT_CONTENT/HR_CONTENT — scoped
// entirely to learner features (aptitude tests, mock interviews, resume
// builder, leaderboard) rather than the institution's placement-cell
// workflow. feature2 (normally "Offer Letters") becomes Mock Interviews,
// and feature3 (normally "Skill Report") becomes the student's own skill
// profile — same verified-rail visual, same idea: a record built up over
// time rather than assembled the week of placements.
export const LEARNER_CONTENT: LandingContent = {
  hero: {
    chip: "Built in Coimbatore, for students placement-ready",
    headlineLine1: "Practice smarter.",
    headlineLine2: "Get placed faster.",
    lede: "AI-scored aptitude tests, mock interviews with real-time feedback, and a resume builder that writes itself from your practice record — plus a national leaderboard so you always know exactly where you stand.",
    ctaPrimary: "Get started free",
    ctaSecondary: "See how it works",
    fine: "No credit card needed · Start practicing today",
  },
  dashboard: {
    chromeTitle: "Keerthana R · Learner Portal",
    chromeRight: "2026–27",
    sidebar: ["Dashboard", "Aptitude Tests", "Practice Tools", "Mock Interviews", "Resume Builder", "Top Talent Board", "Placements"],
    mainTitle: "Your progress",
    mainSubtitle: "Updated today, 9:40 AM",
    segments: ["This week", "This month", "All time"],
    kpis: [
      { label: "Tests completed", value: "34", note: "+6 this week", accent: "var(--ts-green)" },
      { label: "Avg. aptitude score", value: "82%", note: "+4% this month", accent: "var(--ts-leaf)" },
      { label: "Mock interviews", value: "12", note: "3 this week", accent: "var(--ts-teal)" },
      { label: "National rank", value: "#142", note: "of 48,000+ learners", accent: "var(--ts-olive)" },
    ],
    panel1Title: "Practice by category",
    panel1Data: [
      { label: "Quant", value: 42, total: 50 },
      { label: "Logical", value: 36, total: 44 },
      { label: "Verbal", value: 28, total: 40 },
      { label: "Coding", value: 24, total: 38 },
      { label: "HR", value: 18, total: 26 },
      { label: "DI", value: 14, total: 24 },
    ],
    panel2Title: "Recent activity",
    panel2ViewAll: "View all",
    panel2Rows: [
      { name: "Quantitative Aptitude", detail: "32 of 40 correct", stage: "80% score", tone: "t-ok" },
      { name: "Mock Interview — SDE", detail: "Google practice set", stage: "Completed", tone: "t-ok" },
      { name: "Resume Builder", detail: "ATS score 91", stage: "Updated", tone: "t-go" },
      { name: "Logical Reasoning", detail: "18 of 20 correct", stage: "90% score", tone: "t-ok" },
      { name: "MNC Test — TCS pattern", detail: "Full-length, 90 min", stage: "In progress", tone: "t-nu" },
    ],
  },
  modules: {
    heading: "Every tool it takes to get placement-ready. In one dashboard.",
    intro: "Practice, mock interviews, resume building and rank tracking all write to the same profile — so by the time a recruiter looks, they see one complete record, not six disconnected attempts.",
    pathLabel: "Your prep path",
    path: [
      { title: "Aptitude Tests", copy: "Quant, logical, verbal and coding — scored instantly, section by section" },
      { title: "Practice Tools", copy: "Topic-wise practice sets, with as many attempts as you need" },
      { title: "Mock Interviews", copy: "An AI interviewer with real-time speech and posture feedback" },
      { title: "Resume Builder", copy: "An ATS-checked resume, built from your actual practice record" },
      { title: "Top Talent Board", copy: "See exactly where you rank, nationally and by college" },
    ],
    alongsideLabel: "Running alongside",
    alongside: [
      { title: "YouTube to Course", accent: "var(--ts-teal)", copy: "Turn any YouTube playlist into a structured course, complete with notes and quizzes." },
      { title: "MNC Test Patterns", accent: "var(--ts-leaf)", copy: "Practice the exact test pattern used by TCS, Infosys, Wipro and more." },
      { title: "Placement Tracker", accent: "var(--ts-olive)", copy: "Every application and offer, tracked against your one student profile." },
    ],
  },
  feature1: {
    eyebrow: "Aptitude Tests",
    eyebrowColor: "var(--ts-green)",
    heading: "Practice the sections that actually show up in placement tests.",
    body: "Quant, logical reasoning, verbal ability and coding — every section scored the moment you submit, with a breakdown of exactly which topics are costing you marks.",
    bullets: [
      "Instant, section-wise scoring",
      "Company-specific test patterns (TCS, Infosys, Wipro)",
      "Retake as many times as you need",
    ],
    cardTitle: "Quantitative Aptitude",
    cardSubtitle: "Time & Work · 20 questions",
    cardCta: "Start test",
    chips: ["Quant", "Logical", "Verbal", "Coding", "Timed"],
    funnel: [
      { label: "Topics started", count: 48, width: "100%", color: "var(--ts-green)" },
      { label: "Practiced", count: 34, width: "71%", color: "var(--ts-leaf)" },
      { label: "Mock tests taken", count: 12, width: "25%", color: "var(--ts-teal)" },
      { label: "Interview-ready", count: 6, width: "12%", color: "var(--ts-olive)" },
    ],
  },
  feature2: {
    cardTitle: "Mock Interviews",
    cardSubtitle: "This month · AI-scored readiness",
    cardBig: "12 done",
    progressPct: "80%",
    rows: [
      ["SDE Interview — Google set", "Today", "9.2 / 10 feedback", "t-ok"],
      ["HR Round — behavioural", "Yesterday", "8.6 / 10 feedback", "t-ok"],
      ["System Design — intro", "3 days ago", "7.4 / 10 feedback", "t-go"],
      ["SDE Interview — Amazon set", "5 days ago", "Reattempt suggested", "t-nu"],
    ],
    eyebrow: "AI Mock Interviews",
    eyebrowColor: "var(--ts-teal)",
    heading: "Practice interviews until walking in feels routine.",
    body: "An AI interviewer asks real questions and scores your answers as you speak — plus real-time posture and eye-contact feedback from your webcam, so the first real interview isn't the first one that counts.",
    bullets: [
      "Real-time speech-to-text scoring",
      "Posture & eye-contact feedback via webcam",
      "Practice as many rounds as you need, on your schedule",
    ],
  },
  feature3: {
    eyebrow: "Your Skill Profile",
    eyebrowColor: "var(--ts-leaf)",
    heading: "A record that builds itself, one practice session at a time.",
    body: "Aptitude scores, mock interview feedback, resume version and rank all sit on the same profile. By the time a recruiter looks, you're not writing a resume from memory — you're exporting a record that's already there.",
    cardTitle: "Skill Profile",
    cardSubtitle: "Keerthana R · B.Sc Computer Science · Rank #142",
    railLabels: ["Started", "Practicing", "Mock-ready", "Placed"],
    rows: [
      ["Aptitude tests taken", "34"],
      ["Mock interviews", "12"],
      ["Resume ATS score", "91 / 100"],
      ["Practice hours logged", "62"],
      ["National rank", "#142"],
      ["Target role", "SDE, Software Engineer"],
    ],
  },
  dataBand: {
    eyebrow: "Data that actually helps you",
    heading: "Every practice session, backed by a record you can hand a recruiter.",
    body: "Nothing you practice disappears into a forgotten tab. Every score, every mock interview, every resume edit stays on your profile — exportable whenever you need it, visible to placement cells who already trust the record.",
    specs: [
      {
        term: "Instantly scored",
        copy: "Aptitude tests and mock interviews are scored the moment you submit — no waiting for a placement cell to grade anything by hand.",
        evLabel: "scored out of",
        evValue: ["100 points"],
      },
      {
        term: "Export any time",
        copy: "Your resume, skill profile and test history leave as files you can attach to any application, on or off the platform.",
        evLabel: "formats",
        evValue: [".pdf · .docx"],
      },
      {
        term: "One profile, every attempt",
        copy: "Every test and interview attempt writes to the same student record — so your progress is visible, not scattered across screenshots.",
        evLabel: "tracked",
        evValue: ["tests · interviews", "resume · rank"],
      },
      {
        term: "Live national rank",
        copy: "Your rank updates the moment a new score comes in, so you always know exactly where you stand against everyone else practicing right now.",
        evLabel: "last updated",
        evValue: ["19.08.26 · 14:22", "quantitative aptitude", "score submitted"],
      },
    ],
    exportTitle: "Resume export · Keerthana R",
    exportSubtitle: "ATS-checked · Updated today",
    exportBadge: "Ready",
    exportRows: [
      ["ATS score", "91 / 100"],
      ["Aptitude average", "82%"],
      ["Mock interviews", "12 completed"],
    ],
    exportCta: "Download my resume",
  },
  numbers: [
    { big: "48,000+", small: "students practicing on TalentSnaps right now, across every department and year" },
    { big: "34", small: "average aptitude tests a placement-ready student completes before their first interview" },
    { big: "82%", small: "average aptitude score among students who complete at least 10 mock interviews" },
    { big: "5 min", small: "to turn a YouTube playlist into a structured course with notes and quizzes" },
  ],
  faq: {
    heading: "Questions students ask before they start",
    items: [
      {
        q: "Is it free to start practicing?",
        a: "Yes — aptitude tests, practice tools and a limited number of mock interviews are free to start. Upgrade any time for unlimited mock interviews and advanced resume tools.",
      },
      {
        q: "How does the AI mock interviewer actually work?",
        a: "It asks real interview questions, scores your spoken answer as you talk, and — if your webcam is on — gives real-time feedback on posture and eye contact, the same way a human interviewer would notice.",
      },
      {
        q: "Will my college see my practice scores?",
        a: "If your college is a partner institution, your placement cell can see your progress on the same record — so you don't have to re-prove your prep in every conversation.",
      },
      {
        q: "Can I practice company-specific test patterns?",
        a: "Yes — TCS, Infosys, Wipro and other common MNC test formats are available as full-length timed practice tests, not just topic-wise questions.",
      },
      {
        q: "Does the resume builder actually check for ATS compatibility?",
        a: "Yes — every resume gets an ATS score based on formatting, keywords and structure, built directly from your practice record instead of a blank template.",
      },
      {
        q: "What happens to my data if I stop using TalentSnaps?",
        a: "You can export your resume, skill profile and test history at any time — before or after closing your account. Your practice record stays yours.",
      },
    ],
  },
  cta: {
    heading: "Start practicing for your next placement season.",
    body: "Take your first aptitude test or mock interview today, and see exactly where you stand on the leaderboard.",
    primary: "Get started free",
    secondary: "See how it works",
  },
  footer: {
    brandLine1: "AI-powered placement practice for Indian students.",
    brandLine2: "Built in Coimbatore, practiced by students across Tier 2 and Tier 3 colleges.",
    contactHeading: "Talk to us about getting placement-ready",
    contactEmail: "admin@talentsnaps.com · Coimbatore, Tamil Nadu",
    columns: [
      { head: "PRACTICE", items: ["Aptitude Tests", "Practice Tools", "Mock Interviews", "MNC Test Patterns"] },
      { head: "ALSO INSIDE", items: ["Resume Builder", "Top Talent Board", "YouTube to Course", "Placement Tracker"] },
      { head: "FOR STUDENTS", items: ["Resume Export", "Skill Profile", "Onboarding", "Support"] },
      {
        head: "COMPANY",
        items: [
          { label: "About Us", href: "/about-us" },
          { label: "Partner Colleges", href: "/partner-colleges" },
          { label: "Careers", href: "/careers" },
          { label: "Verification", href: "/verification" },
          { label: "Profile Setup", href: "/profile-setup" },
          { label: "Changelog", href: "/changelog" },
          { label: "Contact", href: "#ts-contact-form" },
        ],
      },
      {
        head: "LEGAL",
        items: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms of Service", href: "/terms-of-service" },
          { label: "Data Protection", href: "/data-protection" },
        ],
      },
    ],
    tagline: [
      "Every score tracked on one profile",
      "AI mock interviews, real-time feedback",
      "Your practice record stays yours",
    ],
  },
};

// HR's own copy, same shape, same section structure — reuses HRShowcase's
// exact sample data (vacancies, applicants, talent board) so the numbers
// shown here match what the dashboard shows elsewhere on the site.
export const HR_CONTENT: LandingContent = {
  monsoon: true,
  hero: {
    chip: "Built in Coimbatore, for campus recruiting teams",
    headlineLine1: "Hire top campus talent",
    headlineLine2: "without the guesswork.",
    lede: "Post job vacancies, review AI-scored applicant profiles, and hire from a global talent leaderboard. One connected platform, no separate ATS needed.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Talk to our team",
    fine: "No setup fee · Post your first vacancy today",
  },
  dashboard: {
    chromeTitle: "TCS · Campus Hiring Team",
    chromeRight: "2026–27",
    sidebar: ["Dashboard", "Post a Vacancy", "Applicants", "Talent Board", "Screening", "Candidate Analytics", "Messages"],
    mainTitle: "Hiring overview",
    mainSubtitle: "Updated today, 9:40 AM",
    segments: ["All roles", "Engineering", "Business"],
    kpis: [
      { label: "Active vacancies", value: "6", note: "2 closing this week", accent: "var(--ts-green)" },
      { label: "Total applicants", value: "148", note: "+34 this week", accent: "var(--ts-leaf)" },
      { label: "Shortlisted", value: "22", note: "14.9% of applicants", accent: "var(--ts-teal)" },
      { label: "Avg AI score", value: "88.4", note: "out of 100", accent: "var(--ts-olive)" },
    ],
    panel1Title: "Applicants by role",
    panel1Data: [
      { label: "SDE", value: 54, total: 62 },
      { label: "Data", value: 31, total: 40 },
      { label: "QA", value: 18, total: 28 },
      { label: "BA", value: 16, total: 24 },
      { label: "Design", value: 14, total: 22 },
      { label: "Support", value: 9, total: 18 },
    ],
    panel2Title: "Open vacancies",
    panel2ViewAll: "View all",
    panel2Rows: [
      { name: "Full Stack Developer", detail: "24 applicants", stage: "Shortlisting", tone: "t-go" },
      { name: "Data Analyst", detail: "12 applicants", stage: "Screening", tone: "t-nu" },
      { name: "SDE Intern", detail: "31 applicants", stage: "Applications open", tone: "t-go" },
      { name: "UX Designer", detail: "9 applicants", stage: "Closed", tone: "t-ok" },
      { name: "Business Analyst", detail: "17 applicants", stage: "Round 2 of 3", tone: "t-go" },
    ],
  },
  modules: {
    heading: "Everything it takes to hire, in one connected system.",
    intro: "Every module writes to the same applicant record, so a candidate who applies in August and joins in March is one profile, not six spreadsheets.",
    pathLabel: "The hiring path",
    path: [
      { title: "Post a Vacancy", copy: "Live to every student actively practicing for placement, the moment you publish it" },
      { title: "Applications", copy: "Eligibility and resume details captured the moment a student applies" },
      { title: "AI Screening", copy: "Every applicant pre-scored against the role, so shortlisting takes minutes" },
      { title: "Shortlisting", copy: "Who advances and who doesn't, recorded the day you decide" },
      { title: "Offer Letters", copy: "Sent, tracked and confirmed, without a single follow-up email" },
    ],
    alongsideLabel: "Running alongside",
    alongside: [
      { title: "Candidate Analytics", accent: "var(--ts-teal)", copy: "Track time-to-hire and funnel drop-off at every stage, role by role." },
      { title: "Hiring Reports", accent: "var(--ts-leaf)", copy: "Exportable hiring reports for leadership reviews, generated from data that's already structured." },
      { title: "Talent Board", accent: "var(--ts-olive)", copy: "A live, ranked leaderboard of every candidate's AI score, so you always know who to reach out to first." },
    ],
  },
  feature1: {
    eyebrow: "Vacancies and applications",
    eyebrowColor: "var(--ts-green)",
    heading: "Post a vacancy, reach exactly the students who qualify.",
    body: "Set the criteria once. Department, year, CGPA, backlogs, any requirement the role has. The vacancy reaches only eligible students, and filtering the ineligible ones out stops being somebody's afternoon job.",
    bullets: [
      "Students apply from their own dashboard",
      "Eligibility checked at the moment of applying",
      "Every application timestamped against the vacancy",
    ],
    cardTitle: "New vacancy",
    cardSubtitle: "Full Stack Developer · TCS",
    cardCta: "Publish",
    chips: ["B.Sc CS", "B.Sc IT", "Final year", "CGPA ≥ 6.5", "No backlog"],
    funnel: [
      { label: "Eligible", count: 214, width: "100%", color: "var(--ts-green)" },
      { label: "Applied", count: 148, width: "69%", color: "var(--ts-leaf)" },
      { label: "AI-screened", count: 61, width: "28%", color: "var(--ts-teal)" },
      { label: "Shortlisted", count: 22, width: "10%", color: "var(--ts-olive)" },
    ],
  },
  feature2: {
    cardTitle: "Global Talent Board",
    cardSubtitle: "Full Stack Developer · Ranked by AI score",
    cardBig: "Top 4",
    progressPct: "100%",
    rows: [
      ["Priya Menon", "Computer Science", "94.2", "t-ok"],
      ["Arjun Kumar", "Electronics", "91.5", "t-ok"],
      ["Sneha Iyer", "Computer Science", "89.8", "t-go"],
      ["Deepa Nair", "Information Technology", "87.1", "t-go"],
    ],
    eyebrow: "AI-scored review",
    eyebrowColor: "var(--ts-teal)",
    heading: "Every applicant arrives already ranked.",
    body: "The moment a student applies, their profile is scored against the role and placed on the board. No resume pile to sort through — you already know who to talk to first.",
    bullets: [
      "No manual resume screening",
      "Scores comparable across every applicant",
      "The board updates the moment a new applicant scores in",
    ],
  },
  feature3: {
    eyebrow: "Candidate Profile",
    eyebrowColor: "var(--ts-leaf)",
    heading: "One candidate, one complete profile.",
    body: "Resume, aptitude score, AI screening result and interview readiness sit on the same record. By the time you reach out, you already know exactly who you're talking to.",
    cardTitle: "Candidate Profile",
    cardSubtitle: "Priya Menon · B.Sc Computer Science · Rank #1",
    railLabels: ["Applied", "AI-screened", "Shortlisted", "Contacted"],
    rows: [
      ["Aptitude score", "94.2 / 100"],
      ["Resume parsed", "Yes"],
      ["Mock interviews", "5"],
      ["Backlogs", "0"],
      ["National rank", "#142"],
      ["Applied to", "Full Stack Developer"],
    ],
  },
  dataBand: {
    eyebrow: "Data you can rely on",
    heading: "Every hire you make, backed by verified data.",
    body: "Role based access so each hiring manager sees only their own vacancies, an audit trail behind every shortlist decision, and a full export whenever you want one. Nothing is locked in.",
    specs: [
      {
        term: "AI-scored, not just listed",
        copy: "Every applicant is scored consistently against the role, not sorted by whoever skimmed the resume last.",
        evLabel: "scored out of",
        evValue: ["100 points"],
      },
      {
        term: "Export any time",
        copy: "Applicants, vacancies and hiring reports leave as files your team can open without us in the room.",
        evLabel: "formats",
        evValue: [".xlsx · .csv · .pdf"],
      },
      {
        term: "Role based access",
        copy: "Each hiring manager sees only their own vacancies and applicants, so nobody shares a login.",
        evLabel: "roles",
        evValue: ["hiring manager", "recruiter · viewer"],
      },
      {
        term: "Audit trail",
        copy: "Every shortlist and reject carries a name and a timestamp, so a disputed decision can always be traced back.",
        evLabel: "last entry",
        evValue: ["19.08.26 · 14:22", "candidate shortlisted", "TCS Hiring Team"],
      },
    ],
    exportTitle: "Hiring report · Full Stack Developer",
    exportSubtitle: "This cycle · 148 applicants scored",
    exportBadge: "Ready",
    exportRows: [
      ["Applicants screened", "148"],
      ["Avg AI score", "88.4 / 100"],
      ["Shortlisted", "22"],
    ],
    exportCta: "Download the applicant report",
  },
  numbers: [
    { big: "48,246", small: "colleges in India — most run placements on spreadsheets, which is why outreach gets lost in email threads" },
    { big: "7,692", small: "institutions submitted to NIRF in 2025 — placement data most of them still assemble by hand" },
    { big: "60 of 100", small: "of a college's Graduation Outcomes score depends on placement proof — data your hiring already generates" },
    { big: "3 people", small: "the size of a typical placement team in a Tier 3 college — one reason a posting can take a week to reach students the old way" },
  ],
  faq: {
    heading: "Questions HR teams ask before onboarding",
    items: [
      {
        q: "Do we need to integrate with our existing ATS?",
        a: "No — TalentSnaps works as a standalone hiring workspace for campus recruiting. There's nothing to integrate; you post, screen and shortlist directly on the platform.",
      },
      {
        q: "How does AI scoring actually work?",
        a: "Every applicant's profile — resume, aptitude test results, and academic record — is scored against the role's stated criteria the moment they apply, so shortlisting starts from a ranked list, not a resume pile.",
      },
      {
        q: "Which colleges are on the platform?",
        a: "Colleges across Coimbatore and Tamil Nadu, spanning arts, science, commerce and engineering departments — see the full list on our Partner Colleges page.",
      },
      {
        q: "Is there a cost to post a vacancy?",
        a: "Getting started is free — talk to our team about what fits your hiring volume.",
      },
      {
        q: "Can multiple people on our team review applicants?",
        a: "Yes. Role-based access means every hiring manager and recruiter on your team can review and shortlist from the same vacancy, with an audit trail on every decision.",
      },
      {
        q: "What happens to our applicant data if we stop using TalentSnaps?",
        a: "You can export everything — vacancies, applicants and hiring reports — before closing your account. We don't hold your data hostage.",
      },
    ],
  },
  cta: {
    heading: "Start hiring from this season's talent pool.",
    body: "We'll walk your team through posting a vacancy and reviewing your first shortlist, so you can see exactly how it works.",
    primary: "Get started free",
    secondary: "Talk to our team",
  },
  footer: {
    brandLine1: "AI-scored campus hiring for Indian recruiting teams.",
    brandLine2: "Built in Coimbatore, hiring from Tier 3 and growing Tier 2 institutions.",
    contactHeading: "Talk to us about your next hiring season",
    contactEmail: "admin@talentsnaps.com · Coimbatore, Tamil Nadu",
    columns: [
      { head: "HIRING", items: ["Post a Vacancy", "Applicants", "Screening", "Shortlisting", "Offer Letters"] },
      { head: "ALSO INSIDE", items: ["Talent Board", "Candidate Analytics", "Hiring Reports", "Candidate Profiles"] },
      { head: "FOR EMPLOYERS", items: ["Applicant Data Export", "Hiring Reports", "Onboarding", "Support"] },
      {
        head: "COMPANY",
        items: [
          { label: "About Us", href: "/about-us" },
          { label: "Partner Colleges", href: "/partner-colleges" },
          { label: "Careers", href: "/careers" },
          { label: "Verification", href: "/verification" },
          { label: "Profile Setup", href: "/profile-setup" },
          { label: "Changelog", href: "/changelog" },
          { label: "Contact", href: "#ts-contact-form" },
        ],
      },
      {
        head: "LEGAL",
        items: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms of Service", href: "/terms-of-service" },
          { label: "Data Protection", href: "/data-protection" },
        ],
      },
    ],
    tagline: [
      "Every applicant AI-scored against the role",
      "Role based access, full audit trail",
      "Your data stays yours",
    ],
  },
};
