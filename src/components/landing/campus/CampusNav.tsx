import Image from "next/image";
import Link from "next/link";
import { AUDIENCE_ORDER, CAMPUS_AUDIENCES, landingHref, type CampusAudience } from "./audiences";

export function CampusLogo({ href }: { href: string }) {
  return (
    <Link className="logo" href={href} aria-label="TalentSnaps home">
      <Image className="mark" src="/images/landing/logo-mark.png" alt="" width={36} height={36} priority />
      <span className="wm">
        <b>Talent</b>Snaps
      </span>
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
          <Link href={cfg.help}>Help</Link>
        </nav>
        <div className="nav-r">
          <Link className="login" href={cfg.login}>
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
