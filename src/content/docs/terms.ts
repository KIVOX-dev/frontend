import type { Doc } from "./types";

const PRIVACY = "[Privacy Policy](privacy-policy)";
const COOKIES = "[Cookie Policy](cookie-policy)";
const SECURITY = "[Data Protection & Security](data-protection)";

export const terms: Doc = {
  slug: "terms-and-conditions",
  title: "Terms and Conditions",
  group: "Legal",
  updated: "26 September 2026",
  audiences: ["individuals", "institutions", "recruiters"],
  intro: (a) =>
    ({
      individuals:
        "Welcome to TalentSnaps. These terms apply when you use TalentSnaps as a student or independent learner. By creating an account or using the platform you agree to them, so please read them carefully.",
      institutions:
        "These terms apply when a college, its placement cell or its faculty use TalentSnaps to run training, assessments and campus placements. By creating an institution account or using the platform on your institution's behalf you agree to them.",
      recruiters:
        "These terms apply when an HR or campus hiring team uses TalentSnaps to post vacancies, review applicants and hire from partner colleges. By creating a recruiter account or using the platform on your company's behalf you agree to them.",
    })[a],
  sections: [
    {
      id: "about",
      title: "About These Terms",
      subsections: [
        {
          id: "who-we-are",
          title: "Who we are",
          blocks: [
            {
              p: "TalentSnaps (\"TalentSnaps\", \"we\", \"us\") provides a campus placement and skills platform that connects students, colleges and hiring teams. These terms form an agreement between you and TalentSnaps for your use of the TalentSnaps website, portals and related services (together, the \"platform\").",
            },
          ],
        },
        {
          id: "who-they-apply-to",
          title: "Who these terms apply to",
          blocks: [
            {
              p: "The platform has three kinds of users, and parts of these terms apply only to some of them. Use the audience switch at the top of this page to read the version that applies to you:",
            },
            {
              ul: [
                "**Individuals**: students added by their college, and independent learners who sign up themselves.",
                "**Institutions**: college administrators, placement cells and faculty.",
                "**Recruiters**: HR and campus hiring teams posting vacancies.",
              ],
            },
          ],
        },
        {
          id: "on-behalf",
          title: "Using TalentSnaps for an organisation",
          audiences: ["institutions", "recruiters"],
          blocks: [
            {
              p: "If you use TalentSnaps on behalf of a college or company, you confirm that you're authorised to accept these terms for it, and \"you\" includes that organisation. Where your organisation has a separate signed agreement or order form with TalentSnaps, that agreement takes priority over these terms if the two conflict.",
            },
          ],
        },
        {
          id: "other-policies",
          title: "Other policies that apply",
          blocks: [
            {
              p: `These terms work together with our ${PRIVACY}, which explains how we handle personal data, our ${COOKIES}, and our ${SECURITY} page. By using the platform you also acknowledge those documents.`,
            },
          ],
        },
      ],
    },
    {
      id: "accounts",
      title: "Eligibility and Accounts",
      subsections: [
        {
          id: "eligibility",
          title: "Who can create an account",
          blocks: [
            {
              p: "You must be at least 18 years old to create an account yourself. If you're under 18, a parent or legal guardian must consent to your use of TalentSnaps, and your college or guardian is responsible for giving that consent where the law requires it.",
            },
          ],
          audiences: ["individuals"],
        },
        {
          id: "roles",
          title: "Accounts and roles",
          blocks: [
            {
              p: "Every account has exactly one role: student, faculty, college administrator, or recruiter. The role decides which portal you sign in to and what you can see:",
            },
            {
              table: {
                head: ["Role", "Signs in at"],
                rows: [
                  ["Student or independent learner", "/learner (or /institutional, as an institutional student)"],
                  ["College administrator or faculty", "/institutional"],
                  ["Recruiter / HR", "/hr"],
                ],
              },
            },
            { p: "Roles are set when the account is created, by your institution or by TalentSnaps during onboarding. You can't change your own role." },
          ],
        },
        {
          id: "learner-types",
          title: "Independent learners and college-added students",
          audiences: ["individuals"],
          blocks: [
            {
              p: "If you signed up yourself, you're an independent learner: you control your account and profile. If your college added you, you're an institutional student: your college manages parts of your record (such as department, year and academic details) and can see your results. Placements, Resume Builder and the Top Talent Board are available to institutional students only.",
            },
          ],
        },
        {
          id: "institution-accounts",
          title: "Institution accounts",
          audiences: ["institutions"],
          blocks: [
            {
              p: "New college administrator accounts are reviewed by TalentSnaps before they can sign in. Once approved, administrators can add faculty and students, and approve accounts that register themselves. You're responsible for who you give access to, and for removing access when someone leaves your institution.",
            },
          ],
        },
        {
          id: "recruiter-accounts",
          title: "Recruiter accounts",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "Recruiter accounts are registered with a company name and must be used only by people hiring for that company. Don't create accounts for a company you don't represent, and don't share one account between several companies.",
            },
          ],
        },
        {
          id: "security",
          title: "Keeping your account secure",
          blocks: [
            {
              ul: [
                "Keep your password confidential and don't share your account. Everyone needs their own login.",
                "You're responsible for activity under your account. TalentSnaps isn't liable for loss caused by someone using your credentials because they weren't kept secure.",
                "Tell us straight away at [admin@talentsnaps.com](mailto:admin@talentsnaps.com) if you think someone else has accessed your account.",
                "Verification and password-reset links are single-use and expire after 15 minutes.",
              ],
            },
          ],
        },
        {
          id: "accurate-info",
          title: "Accurate information",
          blocks: [
            {
              p: "Information you give us must be accurate, current and complete, and you must keep it up to date. For institutions this includes student, department and eligibility data you load into the platform; for recruiters it includes vacancy and company details.",
            },
          ],
        },
      ],
    },
    {
      id: "using-the-platform",
      title: "Using the Platform",
      subsections: [
        {
          id: "learning-tools",
          title: "Learning and practice tools",
          audiences: ["individuals"],
          blocks: [
            {
              p: "TalentSnaps gives you aptitude tests, mock practice, a two-round mock interview (a written MCQ round and a spoken round), courses built from YouTube videos, and a resume builder. These tools help you practise and build a verified record; using them doesn't guarantee any particular score, shortlist or job offer.",
            },
          ],
        },
        {
          id: "proctoring",
          title: "Proctored assessments",
          audiences: ["individuals"],
          blocks: [
            { p: "Some assessments are proctored so that results can be trusted by colleges and recruiters. When you start one:" },
            {
              ul: [
                "Your camera, microphone and screen share must stay on for the whole assessment.",
                "You must be alone, facing the camera, visible from face to chest. The first sustained framing problem gives you a warning; a second ends the assessment.",
                "A phone, laptop, TV or remote in view ends the assessment immediately, with no warning.",
                "Tab switches, copy or paste attempts and framing warnings are counted and saved with your result.",
              ],
            },
            {
              note: "Camera and screen analysis runs in your browser. Video, audio and screen images from a proctored assessment are not recorded or uploaded; only the counts above are saved.",
            },
          ],
        },
        {
          id: "scores",
          title: "Scores, rankings and reports",
          audiences: ["individuals"],
          blocks: [
            {
              p: "Your results, readiness score and skill reports are calculated from the tests and interviews you complete. Institutional students' results are visible to their college. The Top Talent Board ranks students nationally by test performance and shows each ranked student's name, college and score to other users of the board.",
            },
          ],
        },
        {
          id: "college-setup",
          title: "Setting up your college",
          audiences: ["institutions"],
          blocks: [
            {
              p: "You can add students one at a time or upload them from a spreadsheet (.xlsx, .xls or .csv), organise them by department and batch year, and approve accounts that register themselves. You're responsible for having the right to upload each student's data and for telling students that their college uses TalentSnaps.",
            },
          ],
        },
        {
          id: "drives-assessments",
          title: "Placement drives and assessments",
          audiences: ["institutions"],
          blocks: [
            {
              p: "You can publish placement drives with eligibility rules, shortlist candidates (including by uploading a roll-number list), update round results, and create assessments assigned by department and batch year. You decide who is shortlisted, selected or marked placed; TalentSnaps records those decisions but doesn't make them.",
            },
          ],
        },
        {
          id: "offers-verification",
          title: "Offer letters and verification",
          audiences: ["institutions"],
          blocks: [
            {
              p: "Before you mark an offer letter or placement as confirmed, you must check it's genuine. Every verification carries the name of the person who made it and a timestamp, so records can be traced back if they're disputed.",
            },
          ],
        },
        {
          id: "reports",
          title: "Reports and exports",
          audiences: ["institutions"],
          blocks: [
            {
              p: "You can export students, drives, offers and reports, including NIRF-ready reports, as .xlsx, .csv or .pdf at any time. You're responsible for the accuracy of what you submit to regulators or accreditation bodies using those exports.",
            },
          ],
        },
        {
          id: "vacancies",
          title: "Posting vacancies",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "Vacancies you post must describe a real, open role your company is hiring for, with an accurate title, package, rounds, deadlines and eligibility rules. Don't post roles that charge candidates a fee, collect data for anything other than hiring, or discriminate unlawfully.",
            },
          ],
        },
        {
          id: "applicants",
          title: "Reviewing applicants",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "You'll see profile, academic and assessment data for students who apply to your vacancies, and aggregate scores on the Talent Board. Use this data only to assess candidates for the vacancies you posted.",
            },
          ],
        },
        {
          id: "hiring-decisions",
          title: "Hiring decisions",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "Scores and rankings on TalentSnaps are one input to your decision, not a recommendation to hire or reject. Your hiring decisions, offers and communications are your own responsibility.",
            },
          ],
        },
        {
          id: "ai-content",
          title: "AI-generated content",
          blocks: [
            {
              p: "Some features use AI to generate content: interview and test questions, resume analysis, job-description matching, cover letters and interview preparation. AI output can be wrong or incomplete. Review it before you rely on it, and don't treat it as professional advice.",
            },
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      subsections: [
        {
          id: "everyone",
          title: "Rules for everyone",
          blocks: [
            { p: "When you use TalentSnaps, don't:" },
            {
              ul: [
                "Submit false eligibility information, forged offer letters or certificates, or misrepresent placement outcomes.",
                "Access, or try to access, accounts or records outside your role's permissions.",
                "Scrape, copy, resell or redistribute data from the platform, including exports, without permission from the institution that owns it.",
                "Upload malware, attack, overload or probe the platform, or get around its security checks or rate limits.",
                "Harass, threaten or discriminate against anyone, or use messages for spam or promotion.",
                "Use the platform for anything unlawful, or in a way that infringes someone else's rights.",
              ],
            },
          ],
        },
        {
          id: "integrity",
          title: "Assessment integrity",
          audiences: ["individuals"],
          blocks: [
            {
              ul: [
                "Take tests and interviews yourself, without help from another person, device or AI tool.",
                "Don't share, publish or sell test questions or answers.",
                "Don't use tricks to get around proctoring, such as virtual cameras, screen overlays or a second device out of view.",
              ],
            },
          ],
        },
        {
          id: "student-data-use",
          title: "Use of student data",
          audiences: ["institutions"],
          blocks: [
            {
              ul: [
                "Give staff access only to the data their job needs.",
                "Don't use student data from TalentSnaps for purposes students weren't told about.",
                "Don't share student exports outside your institution except as required for placement, accreditation or by law.",
              ],
            },
          ],
        },
        {
          id: "candidate-data-use",
          title: "Use of candidate data",
          audiences: ["recruiters"],
          blocks: [
            {
              ul: [
                "Contact students only about the vacancies they applied to, through the platform or their placement cell.",
                "Don't copy candidate data into other systems except as needed to process their application.",
                "Delete candidate data you've exported once it's no longer needed for that hiring process.",
              ],
            },
          ],
        },
        {
          id: "breaches",
          title: "If these rules are broken",
          blocks: [
            {
              p: "We may remove content, cancel results, or suspend or close accounts that break these rules. For institutional students we'll let the placement cell know first. Serious or unlawful misuse may be reported to the relevant authorities.",
            },
          ],
        },
      ],
    },
    {
      id: "content",
      title: "Your Content and Data",
      subsections: [
        {
          id: "ownership",
          title: "What you own",
          blocks: [
            {
              p: "You keep ownership of the content you add to TalentSnaps: your profile, resume, notes, answers and uploads. Institutions own the student, drive and placement records they create. Nothing you put in is locked in: data can be exported, as described in our " + SECURITY + " page.",
            },
          ],
        },
        {
          id: "licence-to-us",
          title: "Permission you give us",
          blocks: [
            {
              p: "You give TalentSnaps permission to host, store, process and display your content only as needed to run the platform for you: for example, showing your results to your college, or your application to the recruiter you applied to. This permission ends when your content is deleted, except for copies we must keep by law or in backups that are overwritten over time.",
            },
          ],
        },
        {
          id: "third-party-content",
          title: "Third-party content",
          blocks: [
            {
              p: "Courses built with YouTube to Course play videos from YouTube; the videos belong to their creators and YouTube's own terms apply. Company names and logos shown on TalentSnaps belong to their owners and are used only to identify those companies.",
            },
          ],
        },
      ],
    },
    {
      id: "connected-services",
      title: "Connected Services",
      blocks: [
        {
          p: "You can sign in with Google and connect accounts such as GitHub, LinkedIn, Stack Overflow, LeetCode and HackerRank to show verified activity on your profile. Those services are run by other companies under their own terms and privacy policies. You can disconnect them at any time from your profile's Integrations tab.",
        },
      ],
      audiences: ["individuals"],
    },
    {
      id: "plans",
      title: "Plans and Payments",
      subsections: [
        {
          id: "free-and-paid",
          title: "Free and paid features",
          audiences: ["individuals"],
          blocks: [
            {
              p: "Core features are free. Independent learners can upgrade to a paid plan for extra features. What each plan includes and its price are shown on the Subscription screen before you upgrade. Students added by their college use the features their college has arranged.",
            },
          ],
        },
        {
          id: "billing",
          title: "Billing, cancellation and refunds",
          audiences: ["individuals"],
          blocks: [
            {
              p: "Paid plans are billed for the period shown when you upgrade. You can cancel at any time; your paid features stay active until the end of the period you've paid for. If you were charged in error, email [admin@talentsnaps.com](mailto:admin@talentsnaps.com) with the date and amount and we'll review it.",
            },
          ],
        },
        {
          id: "commercial",
          title: "Commercial terms",
          audiences: ["institutions", "recruiters"],
          blocks: [
            {
              p: "Pricing, billing, service levels and the length of your subscription are set out in your order form or agreement with TalentSnaps. If that agreement conflicts with these terms, the agreement applies.",
            },
          ],
        },
        {
          id: "price-changes",
          title: "Changes to pricing",
          blocks: [
            { p: "We may change prices or what a plan includes. Changes won't affect a period you've already paid for, and we'll tell you before they apply to you." },
          ],
        },
      ],
    },
    {
      id: "ip",
      title: "Intellectual Property",
      blocks: [
        {
          p: "The platform, including its software, design, question banks, reports and the TalentSnaps name and logo, belongs to TalentSnaps and is protected by law. You may use it only as these terms allow. Don't copy, modify, reverse-engineer or build a competing product from it. If you send us feedback or ideas, we may use them without any obligation to you.",
        },
      ],
    },
    {
      id: "availability",
      title: "Service Availability and Changes",
      blocks: [
        {
          p: "We aim to keep TalentSnaps available during placement season and beyond, but maintenance, updates or events outside our control may occasionally interrupt access. We'll give institutions advance notice of planned downtime where we can. We improve the platform continuously and may add, change or remove features; if a change significantly reduces a paid feature, we'll tell you first.",
        },
      ],
    },
    {
      id: "termination",
      title: "Suspension and Termination",
      subsections: [
        {
          id: "you-leave",
          title: "Leaving TalentSnaps",
          blocks: [
            {
              p: "You can stop using TalentSnaps at any time. To delete your account, email [admin@talentsnaps.com](mailto:admin@talentsnaps.com) from your account's email address.",
            },
            {
              p: "If you're an institutional student, some of your record belongs to your college, so certain deletion requests are handled together with your placement cell.",
            },
          ],
          audiences: ["individuals"],
        },
        {
          id: "institution-leaves",
          title: "Ending your institution's use",
          audiences: ["institutions"],
          blocks: [
            {
              p: "Your institution can stop using TalentSnaps at any time and request a full export of its data first. After a transition period, remaining data is permanently deleted from active systems on request.",
            },
          ],
        },
        {
          id: "recruiter-leaves",
          title: "Closing a recruiter account",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "You can close your account at any time. Vacancies you posted are closed, and applicant data you had access to stays with the colleges and students it belongs to.",
            },
          ],
        },
        {
          id: "we-suspend",
          title: "When we may suspend or close an account",
          blocks: [
            {
              p: "We may suspend or close an account that breaks these terms, puts other users or the platform at risk, or where the law requires it. Where it's appropriate and lawful we'll tell you why first, and give you a chance to respond. For institutional students we'll notify the placement cell.",
            },
          ],
        },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      blocks: [
        {
          p: "TalentSnaps is provided \"as is\" and \"as available\". We work hard to keep it accurate and reliable, but we don't guarantee that it will be error-free or uninterrupted, that AI-generated content is correct, or that using the platform will lead to a placement, interview or job offer. Hiring decisions are made by recruiters and institutions, not by TalentSnaps.",
        },
      ],
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      blocks: [
        {
          p: "To the extent the law allows, TalentSnaps isn't liable for indirect or consequential losses, such as lost opportunities, lost profits or lost data, arising from your use of the platform. Our total liability for any claim is limited to the amount you paid TalentSnaps for the platform in the 12 months before the claim. Nothing in these terms limits liability that can't be limited by law.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to These Terms",
      blocks: [
        {
          p: "We may update these terms as the platform changes or the law requires. The date at the top shows when they last changed. For significant changes we'll notify you by email or in the app before they take effect. If you keep using TalentSnaps after that, you accept the updated terms.",
        },
      ],
    },
    {
      id: "law",
      title: "Governing Law and Disputes",
      blocks: [
        {
          p: "These terms are governed by the laws of India. If you have a concern, please contact us first so we can try to resolve it informally. Disputes that can't be resolved that way will be handled by the competent courts in India.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact and Grievances",
      blocks: [
        {
          p: "Questions or complaints about these terms, including grievances about how your data is handled, can be sent to [admin@talentsnaps.com](mailto:admin@talentsnaps.com). Tell us your name, the email on your account, and what the concern is about.",
        },
      ],
    },
  ],
};
