import type { Doc } from "./types";

export const privacy: Doc = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  group: "Legal",
  updated: "26 September 2026",
  audiences: ["individuals", "institutions", "recruiters"],
  intro:
    "This policy explains what personal data TalentSnaps collects, why, who can see it, which service providers help us process it, and the choices and rights you have. We don't sell personal data.",
  sections: [
    {
      id: "scope",
      title: "Who We Are and What This Covers",
      blocks: [
        {
          p: "TalentSnaps runs a campus placement and skills platform used by students, colleges and hiring teams. This policy covers the TalentSnaps website, the learner, institutional and HR portals, and related emails. It applies alongside our [Terms and Conditions](terms-and-conditions) and [Cookie Policy](cookie-policy).",
        },
      ],
      subsections: [
        {
          id: "institution-role",
          title: "When your college decides",
          blocks: [
            {
              p: "For student records a college uploads or manages on TalentSnaps (such as roll numbers, departments, academic details and placement outcomes), the college decides why and how that data is used, and TalentSnaps processes it on the college's behalf. Some requests about those records are best made to your placement cell; we'll help either way.",
            },
          ],
          audiences: ["individuals", "institutions"],
        },
      ],
    },
    {
      id: "data-we-collect",
      title: "Data We Collect",
      subsections: [
        {
          id: "you-give-us",
          title: "Data you give us",
          blocks: [
            {
              ul: [
                "**Account details**: name, email address, password (stored only as a secure hash), role, and your institution or company.",
                "**Profile details**: photo and cover image, education, skills, links, and usernames you choose to connect (such as LeetCode or HackerRank).",
                "**Resume content**: everything you enter in Resume Builder, and resume text you paste for analysis.",
                "**Messages**: messages you send to other users through the platform.",
                "**Support requests**: what you tell us when you contact us.",
              ],
            },
          ],
        },
        {
          id: "created-as-you-use",
          title: "Data created as you use TalentSnaps",
          audiences: ["individuals", "institutions"],
          blocks: [
            {
              ul: [
                "**Tests and practice**: answers, scores, section scores, time taken and dates for aptitude tests, mock practice and the interview's written round.",
                "**Mock interviews**: the questions you were asked, your typed or transcribed answers, and your ratings.",
                "**Learning**: courses you create, lesson progress and notes.",
                "**Placements**: drive applications, round results, and offer letters or proof you upload.",
                "**Activity**: a log of actions in your account, shown to you under My Activity.",
              ],
            },
          ],
        },
        {
          id: "proctoring-data",
          title: "Proctoring signals",
          audiences: ["individuals", "institutions"],
          blocks: [
            {
              p: "During proctored assessments and mock interviews, your camera, microphone and screen are analysed live in your browser to check that you're alone, in frame, and not using another device.",
            },
            {
              note: "Video, audio and screen images are not recorded or uploaded to TalentSnaps. Only counts are saved with your result: tab switches, copy or paste attempts, framing warnings, and whether a device was detected.",
            },
          ],
        },
        {
          id: "from-institutions",
          title: "Data from your college",
          audiences: ["individuals", "institutions"],
          blocks: [
            {
              p: "If your college added you, it may provide your name, email, roll number, department, year, and academic details such as CGPA and backlog status.",
            },
          ],
        },
        {
          id: "recruiter-data",
          title: "Data about your company and vacancies",
          audiences: ["recruiters"],
          blocks: [
            {
              p: "Your company name, the vacancies you post (title, package, rounds, deadlines, eligibility rules and description), and your actions on applicants, such as moving a candidate to the next round.",
            },
          ],
        },
        {
          id: "connected",
          title: "Data from connected services",
          audiences: ["individuals"],
          blocks: [
            {
              p: "If you sign in with Google, we receive your name, email address and profile photo from Google. If you connect GitHub, LinkedIn or Stack Overflow, we receive basic profile and activity information you authorise. For LeetCode and HackerRank we read the public statistics for the username you enter.",
            },
          ],
        },
        {
          id: "automatic",
          title: "Data collected automatically",
          blocks: [
            {
              p: "Like most websites, our servers record technical data such as your IP address, browser and device type, pages requested and timestamps, to run the service securely and fix problems. If you allow analytics, we also count page views anonymously (see our [Cookie Policy](cookie-policy)).",
            },
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      title: "How We Use Your Data",
      blocks: [
        { p: "We use personal data only for the purposes below:" },
        {
          table: {
            head: ["Purpose", "Examples"],
            rows: [
              ["Running your account", "Signing you in, verifying your email, resetting passwords, showing the right portal for your role."],
              ["Providing the features", "Scoring tests, generating interview questions, building courses, tracking applications and rounds."],
              ["Placements and hiring", "Matching students to eligible drives, sharing applications with the recruiter a student applied to, producing placement reports for colleges."],
              ["Trust and safety", "Proctoring, detecting misuse, security checks on login forms, keeping audit trails of verifications."],
              ["Communicating with you", "Account emails, important service notices, replies to support requests."],
              ["Improving TalentSnaps", "Anonymous page-view counts (with consent) and error logs to fix problems."],
              ["Legal obligations", "Responding to lawful requests and keeping records the law requires."],
            ],
          },
        },
        { p: "We don't sell personal data, and we don't use it for third-party advertising." },
      ],
    },
    {
      id: "ai",
      title: "AI and Speech Processing",
      subsections: [
        {
          id: "ai-features",
          title: "AI features",
          blocks: [
            {
              p: "Some features send data to an AI model provider (Groq) to generate a response. We send only what the feature needs:",
            },
            {
              ul: [
                "**Interview and written-round questions**: the role, company and round you chose. No personal data.",
                "**Resume analysis, job-description matching, cover letters and interview prep**: the resume content and job description you provide.",
                "**Course quizzes**: the lesson's title and topic.",
              ],
            },
          ],
          audiences: ["individuals"],
        },
        {
          id: "speech",
          title: "Spoken answers",
          audiences: ["individuals"],
          blocks: [
            {
              p: "When you answer out loud in the Mock Interviewer, speech-to-text is done by your browser's built-in speech recognition. In Chrome and Edge this sends your audio to the browser maker (Google or Microsoft) to be transcribed. TalentSnaps receives only the text. If you'd rather not use it, type your answers instead.",
            },
          ],
        },
        {
          id: "no-automated-decisions",
          title: "No automated hiring decisions",
          blocks: [
            {
              p: "Scores and rankings help colleges and recruiters compare candidates, but TalentSnaps doesn't make placement or hiring decisions. People at the college or company make them.",
            },
          ],
        },
      ],
    },
    {
      id: "who-can-see",
      title: "Who Can See Your Data",
      blocks: [
        { p: "Access is decided by role, not just by being signed in:" },
        {
          table: {
            head: ["Who", "What they can see"],
            rows: [
              ["You", "Your own profile, results, applications, messages and activity."],
              ["Your college's staff", "Records of their own institution's students, including results and placement status."],
              ["Recruiters", "Profile, academic and assessment data of students who applied to their vacancies, and the Talent Board."],
              ["Other users", "Talent Board rankings show a ranked student's name, college and score. Messages are visible to their recipients."],
              ["TalentSnaps staff", "Only what's needed to run and support the platform, investigate problems, or meet legal obligations."],
            ],
          },
        },
        { p: "Every action that changes a verified record (for example, confirming an offer letter) is logged with who did it and when." },
      ],
    },
    {
      id: "providers",
      title: "Service Providers",
      blocks: [
        {
          p: "We use trusted providers to run TalentSnaps. They process data only on our instructions and to provide their service:",
        },
        {
          table: {
            head: ["Provider", "What they do"],
            rows: [
              ["Vercel", "Hosts the TalentSnaps website."],
              ["Cloudflare", "Delivers the site securely and runs the security check on login and sign-up forms."],
              ["Google Cloud", "Runs our servers and stores uploaded files such as profile photos and offer letters."],
              ["MongoDB", "Hosts our database."],
              ["Brevo", "Sends account emails such as verification and password reset."],
              ["Groq", "Runs the AI model behind question generation and resume features."],
              ["Google", "Sign in with Google, YouTube video playback, and speech-to-text in Chrome."],
              ["GitHub, LinkedIn, Stack Exchange", "Account connections you choose to make."],
              ["LeetCode, HackerRank", "Public statistics for usernames you enter."],
              ["Vercel Web Analytics", "Anonymous page-view counts, only if you allow analytics."],
            ],
          },
        },
        {
          p: "Some providers may process data outside India. Where they do, we rely on their contractual and security commitments to protect it.",
        },
      ],
    },
    {
      id: "retention",
      title: "How Long We Keep Data",
      blocks: [
        {
          ul: [
            "**Account and profile data**: while your account is active, and deleted after you ask us to close it (unless we must keep something by law).",
            "**Institution data**: for as long as the institution uses TalentSnaps. When it stops, it can export everything first; the rest is deleted from active systems after a transition period, on request.",
            "**Verification and reset links**: expire after 15 minutes.",
            "**Proctoring video, audio and screen images**: never stored.",
            "**Backups**: deleted data may remain in encrypted backups until they're overwritten.",
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "Your Rights and Choices",
      subsections: [
        {
          id: "your-rights",
          title: "Your rights",
          blocks: [
            { p: "Subject to applicable law, including India's Digital Personal Data Protection Act, 2023, you can ask us to:" },
            {
              ul: [
                "Tell you what personal data we hold about you and how it's used.",
                "Correct or complete data that's inaccurate or out of date.",
                "Delete your data, where we no longer need it or you withdraw consent.",
                "Stop processing based on your consent, such as analytics or a connected account.",
                "Nominate someone to exercise these rights for you if you die or become unable to.",
              ],
            },
          ],
        },
        {
          id: "how-to",
          title: "How to make a request",
          blocks: [
            {
              p: "Email [admin@talentsnaps.com](mailto:admin@talentsnaps.com) from the address on your account. We may need to confirm your identity. You can change many things yourself: edit your profile, disconnect services from the Integrations tab, and change cookie choices with the Cookie settings link.",
            },
          ],
        },
        {
          id: "students-requests",
          title: "Requests about college records",
          audiences: ["individuals", "institutions"],
          blocks: [
            {
              p: "Requests about records your college manages, such as academic details or placement outcomes, may need your college's confirmation. We'll coordinate with the placement cell and keep you informed.",
            },
          ],
        },
      ],
    },
    {
      id: "minors",
      title: "Students Under 18",
      audiences: ["individuals", "institutions"],
      blocks: [
        {
          p: "Some first-year students may be under 18. Where the law requires it, their use of TalentSnaps needs the consent of a parent or guardian, which the college arranges for the students it adds. We don't use under-18 users' data for tracking, behavioural monitoring or targeted advertising.",
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        {
          p: "We protect data with encryption in transit, hashed passwords, short-lived sign-in tokens, role-based access and audit trails. No system is perfectly secure; read our [Data Protection & Security](data-protection) page for details, and tell us immediately if you suspect a problem.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      blocks: [
        {
          p: "We'll update this policy when our practices change. The date at the top shows the latest version. For significant changes we'll notify you by email or in the app.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact and Grievance Officer",
      blocks: [
        {
          p: "For privacy questions, requests or complaints, contact our grievance officer at [admin@talentsnaps.com](mailto:admin@talentsnaps.com). If you're not satisfied with our response, you may complain to the Data Protection Board of India once it accepts complaints under the DPDP Act.",
        },
      ],
    },
  ],
};
