import Link from "next/link";
import { AUDIENCE_ORDER, CAMPUS_AUDIENCES, landingHref, type CampusAudience } from "./audiences";
import { CampusLogo } from "./CampusNav";
import { FooterWord } from "./primitives";

export function CampusFooter({ audience }: { audience: CampusAudience }) {
  const cfg = CAMPUS_AUDIENCES[audience];
  const { footer } = cfg;
  return (
    <footer className="sitefoot">
      <div className="frame">
        <div className="rule"></div>
        <div className="row">
          <div className="fgrid">
            <div>
              <CampusLogo href={cfg.path} />
              <p>{footer.blurb}</p>
            </div>
            <div>
              <h5>Product</h5>
              {footer.product.map((l) => (
                <a key={l.href} href={landingHref(audience, l.href)}>
                  {l.label}
                </a>
              ))}
            </div>
            <div>
              <h5>More</h5>
              {footer.more.map((l) => (
                <a key={l.href} href={landingHref(audience, l.href)}>
                  {l.label}
                </a>
              ))}
              <Link href={cfg.help}>Troubleshooting</Link>
            </div>
            <div>
              <h5>Also on TalentSnaps</h5>
              {AUDIENCE_ORDER.filter((k) => k !== audience).map((k) => (
                <Link key={k} href={CAMPUS_AUDIENCES[k].path}>
                  {CAMPUS_AUDIENCES[k].label}
                </Link>
              ))}
              <Link href="/privacy-policy">Privacy policy</Link>
              <Link href="/terms-of-service">Terms of service</Link>
            </div>
          </div>
        </div>
        <div className="rule"></div>
        <div className="row">
          <FooterWord text="TalentSnaps" />
        </div>
        <div className="rule"></div>
        <div className="row">
          <div className="fbot">
            <span>
              © {new Date().getFullYear()} TalentSnaps · {footer.tag}
            </span>
            <span>Skill meets opportunities</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
