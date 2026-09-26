import type { Doc } from "./types";

// Keep in step with the code: every key below is one the app actually reads
// or writes. A new category also needs lib/cookieConsent.ts updated and
// CONSENT_VERSION bumped so everyone is asked again.
export const cookies: Doc = {
  slug: "cookie-policy",
  title: "Cookie Policy",
  group: "Legal",
  updated: "26 September 2026",
  audiences: ["individuals", "institutions", "recruiters"],
  intro:
    "Which cookies and browser storage TalentSnaps uses, what the services we rely on store, and how to change your choice at any time.",
  sections: [
    {
      id: "what",
      title: "What This Policy Covers",
      blocks: [
        {
          p: "Cookies are small files a website saves in your browser. TalentSnaps mostly uses a similar technology, your browser's local storage, which works the same way for privacy purposes. The [Privacy Policy](privacy-policy) covers the personal data itself.",
        },
      ],
    },
    {
      id: "choice",
      title: "Your Choice",
      blocks: [
        {
          p: "The first time you visit, including the first time you open a login screen, we show a cookie notice. Strictly necessary storage is always on, because the site can't sign you in without it. Analytics and embedded media stay off until you allow them. You can choose **Accept all**, **Essential only**, or **Customize** to pick each category.",
        },
      ],
    },
    {
      id: "necessary",
      title: "Strictly Necessary",
      blocks: [
        { p: "Stored in your browser by TalentSnaps itself, and never used for advertising:" },
        {
          table: {
            head: ["Name", "Purpose"],
            rows: [
              ["upscaler-ai-auth", "Keeps you signed in and remembers your basic account details between visits."],
              ["upscaler_ai_token, upscaler_ai_refresh_token", "Sign-in tokens that prove who you are to our servers. Removed when you log out."],
              ["ts_cookie_consent", "Remembers the choice you made in the cookie notice."],
              ["upscaler_ai_practice_stats", "Keeps recent practice results on this device for your trend charts."],
              ["ts_chunk_reload_at (session only)", "Lets the site reload once to pick up a new version after an update, without looping."],
            ],
          },
        },
        {
          p: "Login, registration and password-reset forms also run Cloudflare Turnstile, a security check that tells people apart from automated sign-up attempts. Cloudflare may store what the check needs to work. It only loads on those forms.",
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      blocks: [
        {
          p: "With your permission we use Vercel Web Analytics to count page views and see which pages are used. It doesn't use cookies, doesn't follow you to other websites, and reports only totals, not individual visitors. If you choose Essential only, it doesn't load at all.",
        },
      ],
    },
    {
      id: "media",
      title: "Embedded Media",
      blocks: [
        {
          p: "Course lessons, including courses you create with YouTube to Course, play through YouTube's player. When a video loads, YouTube (Google) sets its own cookies under [Google's cookie policy](https://policies.google.com/technologies/cookies). If you haven't allowed embedded media, the player stays blank and shows an **Allow and play** button instead, so nothing loads from YouTube until you choose.",
        },
      ],
    },
    {
      id: "sign-in",
      title: "Sign-in and Connected Accounts",
      blocks: [
        {
          p: "If you sign in with Google, or link GitHub, LinkedIn or Stack Overflow from your profile, that step happens on the provider's own site, which applies its own cookies. These run only when you start them, so they aren't part of the cookie notice.",
        },
      ],
    },
    {
      id: "manage",
      title: "Changing or Clearing Your Choice",
      blocks: [
        {
          p: "You can change your choice at any time. It takes effect straight away and is saved in this browser only, so you'll be asked separately on each device you use.",
        },
        { cookieSettings: true },
        {
          p: "Clearing this site's data in your browser settings removes everything listed above, signs you out and brings the cookie notice back. We'll also ask again if this policy adds a new kind of storage.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [{ p: "Questions about cookies or this policy can be sent to [admin@talentsnaps.com](mailto:admin@talentsnaps.com)." }],
    },
  ],
};
