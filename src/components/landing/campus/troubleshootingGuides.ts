import type { CampusAudience } from "./audiences";

// Troubleshooting guides for the three portals (/learner, /hr, /institutional).
// Every quoted message is the exact text the portal shows, so people can
// search the page for what they see on screen. Keep them in sync when a
// module's copy changes.

export type Fix = {
  /** The symptom, or the exact on-screen message in quotes. */
  q: string;
  a: string;
  steps?: string[];
};

export type Module = { id: string; title: string; where: string; fixes: Fix[] };

export type Group = { id: string; title: string; modules: Module[] };

export type Guide = {
  portal: string;
  loginPath: string;
  title: string;
  lede: string;
  groups: Group[];
};

export const SUPPORT_EMAIL = "admin@talentsnaps.com";

const signIn = (portal: string, path: string, extra: Fix[] = []): Module => ({
  id: "sign-in",
  title: "Signing in",
  where: `Log in on ${path}`,
  fixes: [
    {
      q: "“Please complete the verification challenge.”",
      a: "The security check under the form hasn't finished yet.",
      steps: [
        "Wait for the check to show a tick before you press Log in.",
        "If the check never appears, pause ad or script blockers for talentsnaps.com and refresh the page.",
      ],
    },
    {
      q: "“Invalid credentials. Please try again.”",
      a: "The email and password don't match an account on this portal.",
      steps: [
        "Check the email for typos and make sure Caps Lock is off.",
        "Use Forgot password on the login screen to set a new one.",
        `Make sure you're on the right portal. ${portal} accounts only sign in at ${path}.`,
      ],
    },
    {
      q: "I signed in but I'm back on the login screen",
      a: "You're signed in with a different account type. Each portal only opens for its own accounts: students at /learner, HR teams at /hr, and college admins, faculty and college students at /institutional.",
      steps: ["Log out from the profile menu.", `Sign in again at ${path} with your ${portal} account.`],
    },
    {
      q: "“This verification link is invalid or has expired.”",
      a: "Email links work once and for a limited time.",
      steps: ["Request a new link from the login screen.", "Open only the newest email; older links stop working."],
    },
    ...extra,
  ],
});

const browserBasics: Module = {
  id: "browser",
  title: "Browser and connection",
  where: "Every screen",
  fixes: [
    {
      q: "A screen stays blank or keeps loading",
      a: "Usually a dropped connection or an out-of-date page.",
      steps: [
        "Refresh the page. Your sign-in is kept.",
        "Use a current version of Chrome, Edge, Firefox or Safari.",
        "On office or college Wi-Fi, check that talentsnaps.com isn't blocked by a firewall.",
      ],
    },
    {
      q: "“Something went wrong. Please try again.”",
      a: "The server didn't answer in time. Wait a moment and repeat the action. If it keeps happening, email us the screen name and the time it happened.",
    },
  ],
};

// Student modules are shared by independent learners (/learner) and
// college-added students (/institutional), so both guides use this list.
const studentModules: Module[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    where: "Sidebar › Dashboard",
    fixes: [
      {
        q: "“Failed to fetch stats”",
        a: "Your stats couldn't be loaded. Press Retry on the message, or refresh the page. New accounts show empty stats until you finish your first test.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile and settings",
    where: "Sidebar › Profile, or the profile menu › Settings",
    fixes: [
      {
        q: "“Image must be under 5MB.”",
        a: "Profile photos can be JPEG, PNG, GIF or WebP, up to 5 MB. Resize or compress the photo and upload it again.",
      },
      {
        q: "“That connection attempt expired — please try again.”",
        a: "Linking GitHub, LinkedIn or Stack Overflow took too long. Start again and finish in the pop-up without closing it. Allow pop-ups for talentsnaps.com if nothing opens.",
      },
      {
        q: "“Failed to load your performance summary.”",
        a: "Your Performance Summary is on the Profile screen's About tab. Refresh the page. It fills in after you've taken tests.",
      },
      {
        q: "“Failed to change password”",
        a: "Check your current password is typed correctly and the new one is filled in, then save again. Forgot the current one? Log out and use Forgot password.",
      },
      {
        q: "I can't find Settings",
        a: "Settings is in the profile menu (your name and photo), not in the sidebar.",
      },
    ],
  },
  {
    id: "aptitude-tests",
    title: "Aptitude Tests",
    where: "Sidebar › Aptitude Tests",
    fixes: [
      {
        q: "“Unable to start this assessment right now.”",
        a: "The test may not have opened yet or may have closed. Check its start and end times, then try again during that window.",
      },
      {
        q: "“Failed to load questions.”",
        a: "Refresh the page and open the test again.",
      },
      {
        q: "“Failed to submit. Please try again.”",
        a: "Don't close the tab. Check your connection and press Submit again; your answers are still on screen.",
      },
      {
        q: "Where is my Test History?",
        a: "Open Aptitude Tests and press History. It's no longer a separate sidebar item.",
      },
      {
        q: "“No course assessments taken yet.”",
        a: "Test History lists assessments you've submitted. A test you left before submitting doesn't appear here.",
      },
    ],
  },
  {
    id: "proctored-assessment",
    title: "Proctored assessments",
    where: "Opens in its own window from a course's Assessment tab",
    fixes: [
      {
        q: "“No camera or microphone was found on this device.”",
        a: "Proctored assessments need a working camera, microphone and screen share for the whole session.",
        steps: [
          "Connect a webcam and close other apps that might be using it (Zoom, Teams, Camera).",
          "Click the lock icon in the address bar and set Camera and Microphone to Allow.",
          "Press Retry Camera Check.",
        ],
      },
      {
        q: "Screen sharing was refused or stopped",
        a: "Press Retry Screen Share and share your screen again. Keep sharing until you submit: stopping the share is recorded with your result.",
      },
      {
        q: "“No one is visible in the camera”, “More than one person is visible” or “Move back so the camera can see your face and chest.”",
        a: "You must be alone, facing the camera, visible from face to chest. The first time this lasts more than two seconds you get a warning; the second time the assessment ends.",
        steps: ["Sit in good light with a plain background.", "Place the camera at eye level, about an arm's length away."],
      },
      {
        q: "“An external device … was detected in your camera — the assessment was stopped immediately.”",
        a: "Phones, laptops, TVs and remotes in view end the assessment with no warning. Clear them out of the camera's view before you start.",
      },
      {
        q: "My tab switches were counted",
        a: "Switching tabs, opening other apps and copy or paste attempts are counted and saved with your result. Close everything else before you start.",
      },
    ],
  },
  {
    id: "practice",
    title: "Mock Practice",
    where: "Sidebar › Practice Tools › Mock Practice",
    fixes: [
      { q: "“Failed to load question data.”", a: "Refresh the page and pick the topic again." },
      {
        q: "“Your score was calculated, but saving it to your profile failed.”",
        a: "You saw your score, but it didn't reach your profile, so your trend charts may miss this session. Take another session later and it will be saved normally.",
      },
    ],
  },
  {
    id: "mnc",
    title: "MNC Test",
    where: "Sidebar › Practice Tools › MNC Test",
    fixes: [
      {
        q: "“Failed to load test data.”",
        a: "The company test couldn't be loaded. Refresh, and if it still fails try again later. Other practice tools keep working.",
      },
    ],
  },
  {
    id: "mock-interview",
    title: "Mock Interviewer",
    where: "Sidebar › Practice Tools › Mock Interviewer",
    fixes: [
      {
        q: "“Failed to start interview. Please try again.”",
        a: "Allow camera and microphone for talentsnaps.com (lock icon in the address bar), refresh, and start again.",
      },
      {
        q: "“Move closer”, “Move back”, “Raise your camera” or “Lower your camera”",
        a: "These are framing tips, not penalties. Adjust until the message disappears: face centred, shoulders level and in frame.",
      },
      {
        q: "“Camera disconnected — please reconnect your webcam to continue.”",
        a: "Plug the webcam back in, or close the app that took it over (Zoom, Teams, Camera). If the warning stays, refresh and start a new interview.",
      },
      {
        q: "“A phone or other device was detected in your camera — the interview was stopped immediately.”",
        a: "Keep phones and other screens out of view and start a new interview.",
      },
      { q: "Where are my past interviews?", a: "Open Mock Interviewer and switch to the History tab." },
    ],
  },
  {
    id: "learnings",
    title: "Learnings and YouTube to Course",
    where: "Sidebar › Learnings, Sidebar › YouTube to Course",
    fixes: [
      {
        q: "“Couldn't convert that link”",
        a: "The converter needs a link to a single YouTube video or a playlist.",
        steps: [
          "Open the video or playlist on YouTube and copy the link from the address bar.",
          "Private videos can't be converted. Check the video plays when you're signed out of YouTube.",
        ],
      },
      { q: "“Couldn't load your courses”", a: "Refresh the Learnings page. Your courses aren't lost." },
      { q: "“Couldn't remove this course”", a: "Refresh and try again. If the course still shows, email us its title." },
    ],
  },
  {
    id: "setup",
    title: "Setup",
    where: "Sidebar › Setup",
    fixes: [
      { q: "“Couldn't load your setup progress”", a: "Refresh the page. Steps you've already finished are saved." },
      { q: "“Couldn't save that job role”", a: "Check your connection, then choose the role again." },
    ],
  },
  {
    id: "resume",
    title: "Resume Builder",
    where: "Sidebar › Resume Builder",
    fixes: [
      {
        q: "“AI request failed. Please check your network connection.”",
        a: "Analysis, JD match, cover letters and interview prep all call the AI service. Check your connection and try again in a minute.",
      },
      {
        q: "“Failed to parse resume text. Please try again.”",
        a: "Paste plain text rather than a scanned image, and remove tables or text boxes the parser can't read.",
      },
      {
        q: "“Failed to export PDF.”",
        a: "Allow downloads for talentsnaps.com, then export again. If it still fails, try another browser.",
      },
    ],
  },
];

const subscription: Module = {
  id: "subscription",
  title: "Subscription",
  where: "Free Plan strip at the bottom of the sidebar (independent learners)",
  fixes: [
    {
      q: "I upgraded but Pro features are still locked",
      a: "Wait for “Upgraded to Pro successfully!”, then refresh the page. If Pro still isn't active, email us the time you upgraded.",
    },
  ],
};

const activity: Module = {
  id: "activity",
  title: "My Activity",
  where: "Profile menu › My Activity",
  fixes: [
    {
      q: "Something I did isn't listed",
      a: "Activity is recorded when an action finishes. If the action showed an error, it didn't complete and won't be listed. Refresh to see recent entries.",
    },
  ],
};

const messages: Module = {
  id: "messages",
  title: "Messages",
  where: "Sidebar › Messages",
  fixes: [
    {
      q: "“No contacts found”",
      a: "Your contacts are the people at your college on TalentSnaps. The list is empty until faculty or students have been added and approved.",
    },
    {
      q: "New messages don't appear until I refresh",
      a: "Messages arrive live over a connection that can drop on flaky Wi-Fi or after the laptop sleeps. Refresh the page to reconnect; nothing sent is lost.",
    },
    {
      q: "A student says they didn't get my group message",
      a: "Group messages are copied to each person in the group when you send them. Students added after that won't see earlier ones, so send it again if needed.",
    },
  ],
};

const collegeOnly: Module[] = [
  {
    id: "placements",
    title: "Placements",
    where: "Sidebar › Placements",
    fixes: [
      {
        q: "“Placements is available for institutional students only.”",
        a: "Placements, Resume Builder and the Top Talent Board appear for students whose college added them to TalentSnaps. Ask your placement cell to add you, then sign in through /institutional.",
      },
      { q: "“Failed to load placement opportunities.”", a: "Refresh the page. Drives appear once your placement cell publishes them." },
      {
        q: "“Failed to submit application.”",
        a: "Check the drive is still open and that you meet its eligibility criteria, then apply again. Ask your placement cell if it keeps failing.",
      },
      {
        q: "“Failed to submit your placement. Please check the details and try again.”",
        a: "Check the company, role and offer details, then submit again. Ask your placement cell if you still can't submit.",
      },
      { q: "“Failed to withdraw application.”", a: "Refresh and try again. If it still fails, ask your placement cell to withdraw you." },
    ],
  },
  {
    id: "talent-board",
    title: "Top Talent Board",
    where: "Sidebar › Top Talent Board",
    fixes: [
      { q: "I'm not on the board", a: "The board ranks test results. Take an aptitude test and your score appears after it's submitted." },
    ],
  },
];

export const GUIDES: Record<CampusAudience, Guide> = {
  learners: {
    portal: "Student",
    loginPath: "/learner",
    title: "Troubleshooting for students",
    lede: "Fixes for every module in the student portal. Search this page for the exact message on your screen.",
    groups: [
      {
        id: "account",
        title: "Account",
        modules: [
          signIn("student", "/learner", [
            {
              q: "“Google sign-in failed. Please try again.”",
              a: "Allow pop-ups and third-party cookies for talentsnaps.com, then try Google sign-in again.",
            },
            {
              q: "“Registration failed. Please try again.”",
              a: "Check your name, email and password are filled in. If the email already has an account, log in or reset the password instead.",
            },
          ]),
          activity,
          browserBasics,
        ],
      },
      { id: "learning", title: "Learning portal", modules: [...studentModules, subscription] },
      { id: "college", title: "Added by your college", modules: collegeOnly },
    ],
  },
  hr: {
    portal: "HR",
    loginPath: "/hr",
    title: "Troubleshooting for HR teams",
    lede: "Fixes for every module in the HR portal. Search this page for the exact message on your screen.",
    groups: [
      {
        id: "account",
        title: "Account",
        modules: [
          signIn("HR", "/hr", [
            {
              q: "“Please enter your company name.” or “Please fill in all fields.”",
              a: "Registration needs your name, work email, company name and a password. Fill every field and submit again.",
            },
            {
              q: "“Registration failed. Please try again.”",
              a: "If the email already has an account, log in or reset the password instead.",
            },
          ]),
          activity,
          browserBasics,
        ],
      },
      {
        id: "hiring",
        title: "Hiring",
        modules: [
          {
            id: "dashboard",
            title: "Dashboard",
            where: "Sidebar › Dashboard",
            fixes: [{ q: "“No data yet”", a: "Figures fill in once you've posted a vacancy and students start applying." }],
          },
          {
            id: "post-vacancy",
            title: "Post Vacancy",
            where: "Sidebar › Post Vacancy",
            fixes: [
              { q: "“Job Title is required!”", a: "Give the vacancy a title before you post it." },
              {
                q: "“Failed to post job”",
                a: "Check the required fields and your connection, then post again. The vacancy isn't created until you see “Job Posted Successfully!”.",
              },
            ],
          },
          {
            id: "applicants",
            title: "Applicants",
            where: "Sidebar › Applicants",
            fixes: [
              {
                q: "“No applicants yet. Wait for students to apply.”",
                a: "Applicants appear here as soon as students apply to your vacancy. If nobody has applied after a few days, check the vacancy details and requirements aren't narrower than you meant.",
              },
            ],
          },
          {
            id: "talent-board",
            title: "Talent Board",
            where: "Sidebar › Talent Board",
            fixes: [
              {
                q: "The board is empty or a score looks off",
                a: "Scores come from students' test results, shown as a percentage out of 100. The board fills as students take tests; refresh to see new results.",
              },
            ],
          },
          {
            id: "analytics",
            title: "Candidate Analytics",
            where: "Sidebar › Candidate Analytics",
            fixes: [{ q: "Charts are empty", a: "Analytics are built from your applicants. They fill in once you have applications." }],
          },
        ],
      },
    ],
  },
  institutions: {
    portal: "Institution",
    loginPath: "/institutional",
    title: "Troubleshooting for institutions",
    lede: "Fixes for every module your college admins, faculty and students use. Search this page for the exact message on your screen.",
    groups: [
      {
        id: "account",
        title: "Account",
        modules: [
          signIn("institution", "/institutional", [
            {
              q: "I can't see the login form",
              a: "Choose your role first: College Admin, Faculty or Institutional Student. Each has its own sign-in.",
            },
            {
              q: "“Registration request submitted! Please wait for super admin approval.”",
              a: "New college admin accounts are reviewed before they can sign in. You can log in once the request is approved.",
            },
          ]),
          activity,
          browserBasics,
        ],
      },
      {
        id: "admin",
        title: "College admin",
        modules: [
          {
            id: "admin-dashboard",
            title: "Dashboard and reports",
            where: "Sidebar › Dashboard",
            fixes: [
              {
                q: "“Failed to export Excel file” or “Failed to export PDF”",
                a: "Allow downloads for talentsnaps.com and export again. Large reports take a few seconds, so wait before clicking again.",
              },
            ],
          },
          {
            id: "recent-placements",
            title: "Recent Placements",
            where: "Sidebar › Recent Placements",
            fixes: [
              {
                q: "“No placements recorded yet” or “No students placed yet.”",
                a: "Placements appear once students are marked selected in a drive or submit their offer. Update applicant statuses in Placement Drives.",
              },
              {
                q: "“No drives with an open deadline right now.”",
                a: "Every drive's deadline has passed. Create a drive, or extend one, in Placement Drives.",
              },
            ],
          },
          {
            id: "drives",
            title: "Placement Drives",
            where: "Sidebar › Placement Drives",
            fixes: [
              {
                q: "“Failed to read that file — expected an Excel (.xlsx/.xls) or CSV export.”",
                a: "Shortlist uploads accept .xlsx, .xls or .csv. Re-export from your spreadsheet in one of those formats.",
              },
              {
                q: "“… row(s) had no matching roll number and were skipped.”",
                a: "Shortlists are matched on a Roll number column. Rows whose roll number doesn't match a student in Manage Users are skipped.",
                steps: [
                  "Make sure the file has a column with “Roll” in its header.",
                  "Check the skipped roll numbers against Manage Users; extra spaces and case don't matter.",
                ],
              },
              { q: "“Failed to update applicant status”", a: "Refresh the drive and change the status again." },
            ],
          },
          {
            id: "users",
            title: "Manage Users",
            where: "Sidebar › Manage Users",
            fixes: [
              {
                q: "“This user has no student record to update.”",
                a: "Only student accounts have a student record to edit. The account you picked is a faculty or admin account.",
              },
              { q: "“Failed to update student”", a: "Check required fields such as roll number and department, then save again." },
              { q: "“Failed to update verification status”", a: "Refresh the list and try again." },
            ],
          },
          {
            id: "approvals",
            title: "Security & Approvals",
            where: "Sidebar › Security & Approvals",
            fixes: [
              {
                q: "A faculty member or student says they can't sign in yet",
                a: "Self-registered accounts wait here until you approve them. Approve the request and they can sign in straight away.",
              },
              { q: "“Failed to approve user” or “Failed to reject user”", a: "Refresh the pending list; someone else may have already handled the request." },
            ],
          },
          {
            id: "assessments",
            title: "Assessments",
            where: "Sidebar › Assessments",
            fixes: [
              {
                q: "“Assessment created — Assigned to 0 of 0 matching student(s).”",
                a: "Assessments are assigned to students in the department and batch year you picked. No match means no students have that department and year. Check both in Manage Users.",
              },
              {
                q: "“Assessment created — Created, but assigning it failed …”",
                a: "The assessment is saved but students haven't received it. Large batches can take a few minutes. Use Assign on the assessment to send it again.",
              },
              { q: "“Failed to create assessment”", a: "Check the title, dates and marks, then create it again." },
            ],
          },
          messages,
        ],
      },
      {
        id: "faculty",
        title: "Faculty",
        modules: [
          {
            id: "upload-students",
            title: "Upload Students",
            where: "Sidebar › Upload Students",
            fixes: [
              { q: "“Please select a file”", a: "Choose a spreadsheet before pressing Upload." },
              {
                q: "“Upload failed. Please check file format.”",
                a: "Uploads accept .xlsx, .xls or .csv, and only the first sheet is read.",
                steps: [
                  "Include columns for name, email and roll number. Common headers such as “Roll No.”, “Email ID” or “Enrollment No.” are recognised.",
                  "If there's no roll number, one is made from the part of the email before the @.",
                  "Department names in the file should match your college's departments (for example “CSE” or “Computer Science”).",
                ],
              },
            ],
          },
          {
            id: "add-student",
            title: "Add Student",
            where: "Sidebar › Add Student",
            fixes: [
              {
                q: "“Failed to create student.”",
                a: "The email or roll number may already belong to another student. Search Student Tracking, then use a different value.",
              },
            ],
          },
          {
            id: "tracking",
            title: "Student Tracking",
            where: "Sidebar › Student Tracking",
            fixes: [
              {
                q: "A student is missing from the list",
                a: "Students appear once they've been added or uploaded and, if they self-registered, approved under Security & Approvals.",
              },
              { q: "“No students found.”", a: "Clear the search box. Search matches name, email or roll number." },
            ],
          },
          messages,
          {
            id: "faculty-password",
            title: "Password",
            where: "Faculty dashboard",
            fixes: [{ q: "“Failed to change password.”", a: "Check your current password is correct and the new one is filled in, then try again." }],
          },
        ],
      },
      { id: "students", title: "Institutional students", modules: [...studentModules, ...collegeOnly] },
    ],
  },
};
