import type { Metadata } from "next";
import { SitePageLayout } from "@/components/shared/SitePageLayout";
import { CookieSettingsButton } from "@/components/shared/CookieSettingsButton";

export const metadata: Metadata = {
  title: "Cookie Policy — TalentSnaps",
  description: "The cookies and browser storage TalentSnaps uses, why, and how to change your choice.",
};

const TOC = [
  { id: "what-this-covers", label: "What this policy covers" },
  { id: "your-choice", label: "Your choice" },
  { id: "strictly-necessary", label: "Strictly necessary" },
  { id: "analytics", label: "Analytics" },
  { id: "embedded-media", label: "Embedded media" },
  { id: "sign-in-providers", label: "Sign-in and connected accounts" },
  { id: "manage", label: "Changing or clearing your choice" },
  { id: "contact", label: "Contact" },
];

// Keep this page in step with the code: every key below is one the app
// actually reads or writes. Adding a category here also means adding it to
// lib/cookieConsent.ts and bumping CONSENT_VERSION so everyone is asked again.
const NECESSARY = [
  { name: "upscaler-ai-auth", purpose: "Keeps you signed in and remembers your basic account details between visits." },
  { name: "upscaler_ai_token, upscaler_ai_refresh_token", purpose: "Sign-in tokens that prove who you are to our servers. Removed when you log out." },
  { name: "ts_cookie_consent", purpose: "Remembers the choice you made in the cookie notice, so we don't ask again." },
  { name: "upscaler_ai_practice_stats", purpose: "Keeps your recent practice results on this device for your trend charts." },
];

export default function CookiePolicyPage() {
  return (
    <SitePageLayout title="Cookie Policy" updated="September 2026" active="cookie-policy" toc={TOC}>
      <section>
        <h2 id="what-this-covers">1. What this policy covers</h2>
        <p>
          Cookies are small files a website saves in your browser. TalentSnaps mostly uses a similar technology, your
          browser&apos;s local storage, which works the same way for privacy purposes. This policy explains what we store,
          what the services we rely on store, and how you control it. The{" "}
          <a href="/privacy-policy">Privacy Policy</a> covers the personal data itself.
        </p>
      </section>

      <section>
        <h2 id="your-choice">2. Your choice</h2>
        <p>
          The first time you visit, including the first time you open a login screen, we show a cookie notice. Strictly
          necessary storage is always on, because the site can&apos;t sign you in without it. Analytics and embedded media
          stay off until you allow them. You can choose <strong>Accept all</strong>, <strong>Essential only</strong>, or{" "}
          <strong>Customize</strong> to pick each category.
        </p>
      </section>

      <section>
        <h2 id="strictly-necessary">3. Strictly necessary</h2>
        <p>These are stored in your browser by TalentSnaps itself and never used for advertising.</p>
        <ul>
          {NECESSARY.map((n) => (
            <li key={n.name}>
              <code>{n.name}</code>: {n.purpose}
            </li>
          ))}
        </ul>
        <p>
          Login, registration and password-reset forms also run Cloudflare Turnstile, a security check that tells people
          apart from automated sign-up attempts. Cloudflare may store what the check needs to work. It only loads on those
          forms.
        </p>
      </section>

      <section>
        <h2 id="analytics">4. Analytics</h2>
        <p>
          With your permission we use Vercel Web Analytics to count page views and see which pages are used, so we can
          improve them. It doesn&apos;t use cookies, doesn&apos;t follow you to other websites, and reports only totals, not
          individual visitors. If you choose Essential only, it doesn&apos;t load at all.
        </p>
      </section>

      <section>
        <h2 id="embedded-media">5. Embedded media</h2>
        <p>
          Course lessons, including courses you create with YouTube to Course, play through YouTube&apos;s player. When a
          video loads, YouTube (Google) sets its own cookies under{" "}
          <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
            Google&apos;s cookie policy
          </a>
          . If you haven&apos;t allowed embedded media, the player stays blank and shows an <strong>Allow and play</strong>{" "}
          button instead, so nothing loads from YouTube until you choose.
        </p>
      </section>

      <section>
        <h2 id="sign-in-providers">6. Sign-in and connected accounts</h2>
        <p>
          If you sign in with Google, or link GitHub, LinkedIn or Stack Overflow from your profile, that step happens on the
          provider&apos;s own site, which applies its own cookies. We only receive what you approve there. These run only
          when you start them, so they aren&apos;t part of the cookie notice.
        </p>
      </section>

      <section>
        <h2 id="manage">7. Changing or clearing your choice</h2>
        <p>
          You can change your choice at any time. It takes effect straight away and is saved in this browser only, so
          you&apos;ll be asked separately on each device you use.
        </p>
        <p>
          <CookieSettingsButton />
        </p>
        <p>
          Clearing this site&apos;s data in your browser settings removes everything listed above, signs you out and brings
          the cookie notice back. We&apos;ll also ask again if this policy adds a new kind of storage.
        </p>
      </section>

      <section>
        <h2 id="contact">8. Contact</h2>
        <p>
          Questions about cookies or this policy can be sent to{" "}
          <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>.
        </p>
      </section>
    </SitePageLayout>
  );
}
