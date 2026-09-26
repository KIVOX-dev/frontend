export type CampusAudience = "learners" | "hr" | "institutions";

type FooterLink = { label: string; href: string };

type AudienceConfig = {
  label: string;
  path: string;
  /** Portal the "Log in" link opens; each portal shows its own login screen. */
  login: string;
  cta: FooterLink;
  faq: string;
  footer: { blurb: string; tag: string; product: FooterLink[]; more: FooterLink[] };
};

export const CAMPUS_AUDIENCES: Record<CampusAudience, AudienceConfig> = {
  learners: {
    label: "Learners",
    path: "/",
    login: "/learner",
    cta: { label: "Get started", href: "#l-cta" },
    faq: "#l-faq",
    footer: {
      blurb: "Your path from campus to your first offer, in one place from first year.",
      tag: "for students",
      product: [
        { label: "Features", href: "#l-features" },
        { label: "Drives", href: "#l-drives" },
        { label: "Round tracker", href: "#l-rounds" },
        { label: "Assessment report", href: "#l-report" },
      ],
      more: [
        { label: "Offer letter", href: "#l-offer" },
        { label: "Skill Report", href: "#l-skill" },
        { label: "FAQ", href: "#l-faq" },
      ],
    },
  },
  hr: {
    label: "HR teams",
    path: "/for-hr",
    login: "/hr",
    cta: { label: "Book a demo", href: "#h-cta" },
    faq: "#h-faq",
    footer: {
      blurb: "Complete, eligible applicants from partner colleges, screened round by round.",
      tag: "for hiring teams",
      product: [
        { label: "Features", href: "#h-features" },
        { label: "Post a drive", href: "#h-post" },
        { label: "Applicants", href: "#h-applicants" },
        { label: "Screening", href: "#h-rounds" },
      ],
      more: [
        { label: "Share results", href: "#h-results" },
        { label: "How it works", href: "#h-how" },
        { label: "FAQ", href: "#h-faq" },
      ],
    },
  },
  institutions: {
    label: "Institutions",
    path: "/for-institutions",
    login: "/institutional",
    cta: { label: "Book a demo", href: "#i-cta" },
    faq: "#i-faq",
    footer: {
      blurb: "Digital infrastructure for your training and placement cell.",
      tag: "for institutions",
      product: [
        { label: "Features", href: "#i-features" },
        { label: "Announcements", href: "#i-announce" },
        { label: "Company boards", href: "#i-boards" },
        { label: "Offer letters", href: "#i-offers" },
      ],
      more: [
        { label: "NIRF reports", href: "#i-nirf" },
        { label: "Placement path", href: "#i-path" },
        { label: "FAQ", href: "#i-faq" },
      ],
    },
  },
};

export const AUDIENCE_ORDER: CampusAudience[] = ["learners", "hr", "institutions"];
