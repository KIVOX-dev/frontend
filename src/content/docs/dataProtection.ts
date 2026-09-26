import type { Doc } from "./types";

export const dataProtection: Doc = {
  slug: "data-protection",
  title: "Data Protection & Security",
  group: "Legal",
  updated: "26 September 2026",
  audiences: ["individuals", "institutions", "recruiters"],
  intro: "How TalentSnaps keeps data safe: who can access what, how it's protected, how you get it out, and what happens when you leave.",
  sections: [
    {
      id: "access",
      title: "Role-Based Access",
      blocks: [
        {
          p: "Access is enforced by role on our servers, not just hidden in the interface. Nobody shares a login, and no role sees more than its job needs.",
        },
      ],
      subsections: [
        {
          id: "students",
          title: "Students",
          blocks: [{ p: "See only their own record, results, applications and messages." }],
        },
        {
          id: "college-staff",
          title: "College administrators and faculty",
          blocks: [{ p: "See only their own institution's students, drives, assessments and reports. Staff at one college can never see another college's records." }],
        },
        {
          id: "recruiters",
          title: "Recruiters",
          blocks: [{ p: "See only applicants to vacancies they posted, plus the Talent Board. They can't browse a college's full student list." }],
        },
      ],
    },
    {
      id: "audit",
      title: "Audit Trail",
      blocks: [
        {
          p: "Every verification (an offer letter marked confirmed, a student marked selected, a record edited) carries the name of the person who did it and a timestamp. A disputed record can always be traced back to who signed it off, not just when it changed.",
        },
      ],
    },
    {
      id: "protection",
      title: "How Data Is Protected",
      subsections: [
        {
          id: "transit",
          title: "Encryption in transit",
          blocks: [{ p: "All traffic between your browser and TalentSnaps uses HTTPS/TLS, with HSTS so browsers refuse unencrypted connections." }],
        },
        {
          id: "sign-in",
          title: "Sign-in security",
          blocks: [
            {
              ul: [
                "Passwords are stored only as bcrypt hashes; we can't see your password.",
                "Sign-in tokens are short-lived and refreshed automatically; logging out removes them from your browser.",
                "Verification and password-reset links are single-use and expire after 15 minutes.",
                "Login, registration and password-reset forms are protected by Cloudflare Turnstile against automated attacks, and sensitive endpoints are rate-limited.",
              ],
            },
          ],
        },
        {
          id: "files",
          title: "Uploaded files",
          blocks: [{ p: "Uploaded documents such as offer letters are stored in cloud storage with access restricted to the roles entitled to view them." }],
        },
        {
          id: "browser",
          title: "Protections in your browser",
          blocks: [
            {
              p: "The site sends a strict Content Security Policy and other security headers that limit which scripts and connections a page may use, and it can't be embedded inside other websites.",
            },
          ],
        },
        {
          id: "proctoring",
          title: "Proctoring stays on your device",
          audiences: ["individuals", "institutions"],
          blocks: [
            {
              p: "Camera, microphone and screen analysis during proctored assessments runs in the student's browser. Video, audio and screen images are never uploaded; only counts of warnings and events are saved with the result.",
            },
          ],
        },
      ],
    },
    {
      id: "your-data",
      title: "Your Data Stays Yours",
      blocks: [
        {
          p: "Nothing put into TalentSnaps is locked in. Institutions can export students, drives, offers and reports in full at any time as .xlsx, .csv or .pdf, the same formats a placement office already works with.",
        },
      ],
      audiences: ["institutions"],
    },
    {
      id: "export-individual",
      title: "Getting a Copy of Your Data",
      audiences: ["individuals", "recruiters"],
      blocks: [
        {
          p: "You can download your resume as a PDF from Resume Builder and your performance summary from your profile. For a full copy of the personal data we hold about you, email [admin@talentsnaps.com](mailto:admin@talentsnaps.com).",
        },
      ],
    },
    {
      id: "leaving",
      title: "When You Leave",
      subsections: [
        {
          id: "institution-exit",
          title: "If your institution stops using TalentSnaps",
          audiences: ["institutions"],
          blocks: [
            {
              p: "Your institution can request a full export of all its data before closing its account. After a transition period, remaining data is permanently deleted from active systems on request. We don't keep institutional data indefinitely after an account closes.",
            },
          ],
        },
        {
          id: "account-deletion",
          title: "Deleting your account",
          blocks: [
            {
              p: "Email [admin@talentsnaps.com](mailto:admin@talentsnaps.com) from your account's address to close it. Your personal data is deleted from active systems, except anything we must keep by law. Data in encrypted backups is removed as those backups are overwritten.",
            },
          ],
        },
      ],
    },
    {
      id: "responsibilities",
      title: "Shared Responsibilities",
      subsections: [
        {
          id: "institution-duties",
          title: "What institutions are responsible for",
          audiences: ["institutions"],
          blocks: [
            {
              ul: [
                "Uploading only student data you're entitled to use, and telling students their college uses TalentSnaps.",
                "Giving staff the least access they need, and removing it when they leave.",
                "Checking offer letters and records before verifying them.",
                "Keeping exported files secure once they leave TalentSnaps.",
              ],
            },
          ],
        },
        {
          id: "recruiter-duties",
          title: "What recruiters are responsible for",
          audiences: ["recruiters"],
          blocks: [
            {
              ul: [
                "Using candidate data only for the vacancies candidates applied to.",
                "Keeping any exported candidate data secure and deleting it when that hiring process ends.",
                "Keeping your own team's logins individual and secure.",
              ],
            },
          ],
        },
        {
          id: "everyone-duties",
          title: "What everyone can do",
          blocks: [
            {
              ul: [
                "Use a strong password you don't use anywhere else.",
                "Log out on shared or public computers.",
                "Check a link really points to talentsnaps.com before entering your password.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "report",
      title: "Reporting a Concern",
      blocks: [
        {
          p: "If you think your data has been accessed inappropriately, or you've found a security issue, email [admin@talentsnaps.com](mailto:admin@talentsnaps.com) with as much detail as you can. We'll investigate, and if a breach affects your data we'll tell you and the relevant authorities as the law requires.",
        },
      ],
    },
  ],
};
