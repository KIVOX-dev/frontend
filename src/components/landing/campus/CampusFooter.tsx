import Image from "next/image";
import Link from "next/link";
import { AUDIENCE_ORDER, CAMPUS_AUDIENCES, CAMPUS_TO_DOCS, landingHref, type CampusAudience } from "./audiences";
import { CampusLogo } from "./CampusNav";
import { FooterWord } from "./primitives";
import { CookieSettingsButton } from "@/components/shared/CookieSettingsButton";

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
              <CampusLogo href={cfg.path} tone="light" />
              <p>{footer.blurb}</p>
              {/* Level One is a published self-assessment (CAIQ) — the badge itself
                  says so — not a third-party audit or certification. */}
              <a
                className="csa-star"
                href="https://cloudsecurityalliance.org/star/registry/talentsnaps"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/badges/csa-star-level-1.png" alt="" width={72} height={72} />
                <span>
                  CSA STAR Level One
                  <small>View listing</small>
                </span>
              </a>
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
              <h5>Contact</h5>
              <Link href="/talk-to-sales" className="fcta">
                Talk to Sales <span aria-hidden="true">↗</span>
              </Link>
              <a href="mailto:admin@talentsnaps.com">admin@talentsnaps.com</a>
              <Link href="/about-us">About us</Link>
              <Link href="/careers">Careers</Link>
            </div>
            <div>
              <h5>Also on TalentSnaps</h5>
              {AUDIENCE_ORDER.filter((k) => k !== audience).map((k) => (
                <Link key={k} href={CAMPUS_AUDIENCES[k].path}>
                  {CAMPUS_AUDIENCES[k].label}
                </Link>
              ))}
              <Link href={`/docs/${CAMPUS_TO_DOCS[audience]}/privacy-policy`}>Privacy policy</Link>
              <Link href={`/docs/${CAMPUS_TO_DOCS[audience]}/terms-and-conditions`}>Terms and conditions</Link>
              <Link href={`/docs/${CAMPUS_TO_DOCS[audience]}/cookie-policy`}>Cookie policy</Link>
              <CookieSettingsButton className="ts-cookie-btn" />
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
