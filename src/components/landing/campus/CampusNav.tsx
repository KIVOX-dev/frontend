import Image from "next/image";
import Link from "next/link";
import { AUDIENCE_ORDER, CAMPUS_AUDIENCES, landingHref, type CampusAudience } from "./audiences";

// The official horizontal lockup (mark + wordmark + tagline), built from
// public/logos/brand-logo.png by scripts/build-brand-assets.cjs. 1400x308.
const LOCKUP = { width: 1400, height: 308 };

/** Official TalentSnaps logo. `tone="light"` is the white-text version for dark backgrounds. */
export function CampusLogo({ href, tone = "dark" }: { href: string; tone?: "dark" | "light" }) {
  return (
    <Link className="logo" href={href} aria-label="TalentSnaps home">
      <Image
        className="lockup"
        src={tone === "light" ? "/brand/lockup-light.png" : "/brand/lockup.png"}
        alt="TalentSnaps: skill meets opportunities"
        width={LOCKUP.width}
        height={LOCKUP.height}
        sizes="220px"
        priority={tone === "dark"}
      />
    </Link>
  );
}

function AudienceLinks({ audience }: { audience: CampusAudience }) {
  return AUDIENCE_ORDER.map((key) => (
    <Link key={key} href={CAMPUS_AUDIENCES[key].path} aria-current={key === audience ? "page" : undefined}>
      {CAMPUS_AUDIENCES[key].label}
    </Link>
  ));
}

/** Sticky top bar; CampusShell toggles .scrolled on it once the page moves. */
export function CampusNav({ audience }: { audience: CampusAudience }) {
  const cfg = CAMPUS_AUDIENCES[audience];
  return (
    <header className="nav">
      <div className="nav-in">
        <CampusLogo href={cfg.path} />
        <nav className="links" aria-label="Choose your landing">
          <AudienceLinks audience={audience} />
          <a href={landingHref(audience, cfg.faq)}>FAQ</a>
        </nav>
        <div className="nav-r">
          <Link className="btn btn-line btn-sm login" href={cfg.login}>
            Log in
          </Link>
          <a className="btn btn-dark btn-sm" href={landingHref(audience, cfg.cta.href)}>
            {cfg.cta.label}
          </a>
        </div>
      </div>
      <nav className="mseg" aria-label="Choose your landing">
        <AudienceLinks audience={audience} />
      </nav>
    </header>
  );
}
