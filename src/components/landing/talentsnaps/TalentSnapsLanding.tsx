"use client";

import "@/styles/talentsnaps-landing.css";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView, useReducedMotion, animate as fmAnimate } from "framer-motion";
import { HeroScene, LandscapeArt, MonsoonOverlay } from "./MountainScene";
import { revealUp, revealEase } from "../reveal";
import { RevealHeading } from "../RevealHeading";
import { TiltCard } from "../TiltCard";
import { MagneticButton } from "../MagneticButton";
import TrustedByColleges from "../TrustedByColleges";
import { ROOT_CONTENT, type LandingContent } from "./landingContent";

/* ------------------------------------------------------------------ *
 * Icons. Stroke only, sized by the `size` prop, coloured by currentColor.
 * Structural, not content — reused as-is regardless of which
 * LandingContent is passed in, since the 5-step drive/hiring path and the
 * 3-card "running alongside" row keep the same icon-per-position meaning
 * across audiences (announce/apply/screen/select/confirm).
 * ------------------------------------------------------------------ */

type IconProps = { size?: number };
type IconComponent = (props: IconProps) => ReactNode;

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Megaphone(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </Svg>
  );
}
function DocCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9.5 14l2 2 3.5-4" />
    </Svg>
  );
}
function Funnel(p: IconProps) {
  return <Svg {...p}><path d="M4 5h16l-6 7v6l-4 2v-8Z" /></Svg>;
}
function PersonCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M4 20c0-3.2 2.7-5 6-5 1 0 2 .2 2.8.5" />
      <path d="M15 17.5l2 2 4-4.5" />
    </Svg>
  );
}
function SealedMail(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" />
      <circle cx="18.5" cy="17" r="3.2" fill="var(--ts-surface)" />
      <path d="M17 17l1.1 1.2 2-2.4" />
    </Svg>
  );
}
function Timer(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M9 2h6" />
    </Svg>
  );
}
function ReportDoc(p: IconProps) {
  return (
    <svg width={p.size ?? 21} height={p.size ?? 21} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4" />
      <path d="M9 17.5h6.5" /><path d="M10 17.5V14" /><path d="M12.5 17.5V11" /><path d="M15 17.5v-5" />
    </svg>
  );
}
function Badge(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5" />
    </Svg>
  );
}

const PATH_ICONS: IconComponent[] = [Megaphone, DocCheck, Funnel, PersonCheck, SealedMail];
const ALONGSIDE_ICONS: IconComponent[] = [Timer, ReportDoc, Badge];

// Verified-seal badge: a scalloped rosette (12 overlapping bumps around a
// core disc) with a checkmark, rather than a plain circle — reads as
// "certified" the way an award seal does. Pops in with a spring once the
// rail bars ahead of it have filled.
function VerifiedBadge({ size = 30, animate: shouldAnimate = false }: IconProps & { animate?: boolean }) {
  const bumps = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    // Rounded to a fixed precision so the server- and client-rendered
    // attribute strings match exactly — raw Math.cos/sin doubles can
    // stringify with a trailing-digit difference between JS engines,
    // which React flags as a hydration mismatch.
    return { cx: Math.round((16 + Math.cos(angle) * 10) * 1000) / 1000, cy: Math.round((16 + Math.sin(angle) * 10) * 1000) / 1000 };
  });
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      initial={shouldAnimate ? { scale: 0, rotate: -35 } : false}
      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.9 }}
    >
      {bumps.map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill="var(--ts-green)" />
      ))}
      <circle cx="16" cy="16" r="11" fill="var(--ts-green)" />
      <path d="M10.8 16.3l3.4 3.4l7-7.2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/* ------------------------------------------------------------------ *
 * Small motion helpers local to this page.
 * ------------------------------------------------------------------ */

// A bar that grows from 0 to its target width/height once scrolled into
// view, instead of just appearing pre-filled — used for every progress /
// funnel bar on the page.
function GrowBar({
  axis = "width",
  target,
  color,
  className,
  delay = 0,
  style,
}: {
  axis?: "width" | "height";
  target: string;
  color?: string;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const dim = axis === "width" ? "width" : "height";
  return (
    <motion.div
      className={className}
      style={{ ...style, background: color }}
      initial={reduceMotion ? false : { [dim]: 0 }}
      whileInView={{ [dim]: target }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: revealEase }}
    />
  );
}

// Animates a leading number up to its target value once in view. Handles
// labels like "48,246", "60 of 100" and "3 people" by counting only the
// leading numeric run and leaving the rest of the string static.
function CountUpStat({ value }: { value: string }) {
  const match = value.match(/^([\d,]+)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(match ? "0" : value);

  useEffect(() => {
    if (!match || !inView) return;
    const target = Number(match[1].replace(/,/g, ""));
    if (reduceMotion) {
      setDisplay(match[1]);
      return;
    }
    const controls = fmAnimate(0, target, {
      duration: 1.4,
      ease: revealEase,
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString("en-IN")),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <span ref={ref}>
      {display}
      {match ? match[2] : ""}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Sections — every piece of copy/sample-data comes from `content`
 * (see landingContent.ts); the JSX/animation/structure is shared across
 * every audience this renders for.
 * ------------------------------------------------------------------ */

function Hero({ content }: { content: LandingContent }) {
  const { hero } = content;
  return (
    <header className="ts-wrap ts-hero" id="ts-dash">
      <motion.span className="ts-chip" {...revealUp(0, 14)}>
        <i />{hero.chip}
      </motion.span>
      <RevealHeading as="h1" delay={0.08}>
        {hero.headlineLine1}<br />{hero.headlineLine2}
      </RevealHeading>
      <motion.p className="ts-lede" {...revealUp(0.18, 16)}>
        {hero.lede}
      </motion.p>
      <motion.div className="ts-row" {...revealUp(0.28, 16)}>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-btn-p">{hero.ctaPrimary}</button>
        </MagneticButton>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-btn-g">{hero.ctaSecondary}</button>
        </MagneticButton>
      </motion.div>
      <motion.span className="ts-fine" {...revealUp(0.36, 10)}>
        {hero.fine}
      </motion.span>
    </header>
  );
}

function Dashboard({ content }: { content: LandingContent }) {
  const { dashboard: d } = content;
  const tallest = Math.max(...d.panel1Data.map((row) => row.total));
  const plotShare = 0.8; // the tallest bar fills 80% of the plot, leaving room for its label

  return (
    <motion.div className="ts-shot" {...revealUp(0.15, 36)}>
      <div className="ts-chrome">
        <div className="ts-cl"><s /><s /><s />{d.chromeTitle}</div>
        <div className="ts-cr">{d.chromeRight} <b /></div>
      </div>

      <div className="ts-dashgrid">
        <div className="ts-side">
          <span className="ts-k">MENU</span>
          {d.sidebar.map((item, i) => (
            <a key={item} className={i === 0 ? "ts-on" : undefined}><i />{item}</a>
          ))}
        </div>

        <div className="ts-main">
          <div className="ts-mh">
            <div><b>{d.mainTitle}</b><span>{d.mainSubtitle}</span></div>
            <div className="ts-seg">
              {d.segments.map((seg, i) => (
                <span key={seg} className={i === 0 ? "ts-on" : undefined}>{seg}</span>
              ))}
            </div>
          </div>

          <div className="ts-kpis">
            {d.kpis.map((k, i) => (
              <motion.div
                className="ts-kpi" key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: revealEase }}
              >
                <s style={{ background: k.accent }} />
                <em>{k.label}</em>
                <strong>{k.value}</strong>
                <small>{k.note}</small>
              </motion.div>
            ))}
          </div>

          <div className="ts-panels">
            <div className="ts-panel">
              <b>{d.panel1Title}</b>
              <div className="ts-bars">
                {d.panel1Data.map(({ label, value, total }, i) => (
                  <div key={label}>
                    <em>{value}</em>
                    <div className="ts-tr" style={{ height: `${(total / tallest) * plotShare * 100}%` }}>
                      <GrowBar axis="height" target={`${(value / total) * 100}%`} className="ts-fl" delay={0.6 + i * 0.06} />
                    </div>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="ts-panel">
              <div className="ts-phead">
                <b style={{ fontSize: 13 }}>{d.panel2Title}</b>
                <a>{d.panel2ViewAll}</a>
              </div>
              {d.panel2Rows.map((row, i) => (
                <motion.div
                  className="ts-drow" key={row.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.06, ease: revealEase }}
                >
                  <div><b>{row.name}</b><span>{row.detail}</span></div>
                  <span className={`ts-tag ts-${row.tone}`}>{row.stage}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Modules({ content }: { content: LandingContent }) {
  const { modules: m } = content;
  return (
    <section className="ts-wrap ts-sec" id="ts-modules">
      <div className="ts-center">
        <RevealHeading as="h2">{m.heading}</RevealHeading>
        <motion.p {...revealUp(0.1)}>
          {m.intro}
        </motion.p>
      </div>

      <div className="ts-flowlabel">{m.pathLabel}</div>
      <div className="ts-flow">
        <motion.div
          className="ts-flow-progress"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease: revealEase }}
        />
        <span className="ts-pulse" aria-hidden="true" />
        <span className="ts-pulse" aria-hidden="true" />
        {m.path.map(({ title, copy }, i) => {
          const Icon = PATH_ICONS[i];
          return (
            <motion.div
              className="ts-step" key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: revealEase }}
            >
              <div className="ts-node" style={{ "--ts-node-delay": `${i * 0.9}s` } as CSSProperties}>
                <span className="ts-num">{i + 1}</span>
                <Icon />
              </div>
              <div className="ts-txt"><h3>{title}</h3><p>{copy}</p></div>
            </motion.div>
          );
        })}
      </div>

      <div className="ts-flowlabel">{m.alongsideLabel}</div>
      <div className="ts-alongside">
        {m.alongside.map(({ title, copy, accent }, i) => {
          const Icon = ALONGSIDE_ICONS[i];
          return (
            <motion.div key={title} {...revealUp(i * 0.1, 16)}>
              <TiltCard maxTilt={5} className="ts-along">
                <span className="ts-ic" style={{ background: accent }}><Icon size={20} /></span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function DrivesFeature({ content }: { content: LandingContent }) {
  const { feature1: f } = content;
  return (
    <section className="ts-wrap ts-feat">
      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: f.eyebrowColor }}>{f.eyebrow}</span>
        <h2>{f.heading}</h2>
        <p>{f.body}</p>
        <ul>
          {f.bullets.map((line) => (
            <li key={line}><i style={{ background: f.eyebrowColor }} />{line}</li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="ts-card"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>{f.cardTitle}</b><span>{f.cardSubtitle}</span></div>
          <button className="ts-btn ts-btn-p" style={{ padding: "8px 14px", fontSize: 12.5 }}>{f.cardCta}</button>
        </div>
        <span className="ts-k">Eligibility</span>
        <div className="ts-chips" style={{ marginTop: 9 }}>
          {f.chips.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="ts-fun">
          {f.funnel.map(({ label, count, width, color }, i) => (
            <div key={label}>
              <div className="ts-lab"><span>{label}</span><b>{count}</b></div>
              <div className="ts-tr"><GrowBar target={width} color={color} className="ts-fl" delay={0.2 + i * 0.1} /></div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function OfferLettersFeature({ content }: { content: LandingContent }) {
  const { feature2: f } = content;
  return (
    <section className="ts-wrap ts-feat ts-rev">
      <motion.div
        className="ts-card"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>{f.cardTitle}</b><span>{f.cardSubtitle}</span></div>
          <b style={{ color: "var(--ts-green)", fontSize: 15.5 }}>{f.cardBig}</b>
        </div>
        <div className="ts-fun">
          <div className="ts-tr" style={{ height: 10 }}>
            <GrowBar target={f.progressPct} color="var(--ts-green)" className="ts-fl" style={{ height: 10 }} delay={0.2} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {f.rows.map(([name, reg, status, tone], i) => (
            <motion.div
              className="ts-drow" key={reg} style={i === 0 ? { borderTop: 0 } : undefined}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: revealEase }}
            >
              <div><b style={{ fontSize: 13.5 }}>{name}</b><span>{reg}</span></div>
              <span className={`ts-tag ts-${tone}`}>{status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: f.eyebrowColor }}>{f.eyebrow}</span>
        <h2>{f.heading}</h2>
        <p>{f.body}</p>
        <ul>
          {f.bullets.map((line) => (
            <li key={line}><i style={{ background: f.eyebrowColor }} />{line}</li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

function SkillReport({ content }: { content: LandingContent }) {
  const { feature3: f } = content;
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, margin: "-100px" });
  const bars = ["ts-on", "ts-on", "ts-on", ""];

  return (
    <section className="ts-wrap ts-feat" id="ts-report">
      <motion.div
        className="ts-copy"
        initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <span className="ts-eyebrow" style={{ color: f.eyebrowColor }}>{f.eyebrow}</span>
        <h2>{f.heading}</h2>
        <p>{f.body}</p>
      </motion.div>

      <motion.div
        ref={cardRef}
        className="ts-card"
        initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: revealEase }}
      >
        <div className="ts-ch">
          <div><b>{f.cardTitle}</b><span>{f.cardSubtitle}</span></div>
        </div>
        <div className="ts-rail">
          {bars.map((state, i) => (
            <motion.s
              key={i}
              className={state}
              initial={{ scaleX: 0 }}
              animate={cardInView && state === "ts-on" ? { scaleX: 1 } : undefined}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.15, ease: revealEase }}
            />
          ))}
          <b><VerifiedBadge animate={cardInView} /></b>
        </div>
        <div className="ts-rlab">
          {f.railLabels.map((y) => <span key={y}>{y}</span>)}
        </div>
        {f.rows.map(([k, v], i) => (
          <motion.div
            className="ts-drow" key={k}
            initial={{ opacity: 0 }}
            animate={cardInView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.4, delay: 1.1 + i * 0.06 }}
          >
            <span style={{ fontSize: 14, color: "var(--ts-body)" }}>{k}</span>
            <b style={{ fontSize: 14 }}>{v}</b>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function ExportCard({ content }: { content: LandingContent }) {
  const { dataBand: d } = content;
  return (
    <motion.div className="ts-export" {...revealUp(0.15, 24)}>
      <div className="ts-eh">
        <div>
          <b>{d.exportTitle}</b>
          <span>{d.exportSubtitle}</span>
        </div>
        <span className="ts-tag ts-t-ok">{d.exportBadge}</span>
      </div>
      {d.exportRows.map(([label, value]) => (
        <div className="ts-row" key={label}><span>{label}</span><b>{value}</b></div>
      ))}
      <button className="ts-cta">{d.exportCta}</button>
    </motion.div>
  );
}

function DataBand({ content }: { content: LandingContent }) {
  const { dataBand: d } = content;
  return (
    <section className="ts-band" id="ts-data">
      <div className="ts-wrap">
        <div className="ts-center">
          <span className="ts-eyebrow" style={{ color: "var(--ts-green)" }}>{d.eyebrow}</span>
          <RevealHeading as="h2" className="ts-mw-17ch">{d.heading}</RevealHeading>
          <motion.p style={{ maxWidth: "66ch", fontSize: 17, lineHeight: 1.72 }} {...revealUp(0.1)}>
            {d.body}
          </motion.p>
        </div>

        <div className="ts-spec">
          {d.specs.map(({ term, copy, evLabel, evValue }, i) => (
            <motion.div key={term} {...revealUp(i * 0.08, 14)}>
              <span className="ts-lab">{term}</span>
              <p>{copy}</p>
              <span className="ts-ev">
                {evLabel}<br />
                <b>
                  {evValue.map((line, j) => (
                    <span key={line}>{j > 0 && <br />}{line}</span>
                  ))}
                </b>
              </span>
            </motion.div>
          ))}
        </div>

        <TiltCard maxTilt={4} className="ts-export-tilt">
          <ExportCard content={content} />
        </TiltCard>
      </div>
    </section>
  );
}

function Numbers({ content }: { content: LandingContent }) {
  return (
    <section className="ts-wrap">
      <div className="ts-nums">
        {content.numbers.map(({ big, small }, i) => (
          <motion.div key={big} {...revealUp(i * 0.1, 14)}>
            <strong><CountUpStat value={big} /></strong>
            <p>{small}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Faq({ content }: { content: LandingContent }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="ts-wrap ts-sec" id="ts-faq">
      <div className="ts-center"><RevealHeading as="h2">{content.faq.heading}</RevealHeading></div>
      <div className="ts-faq">
        {content.faq.items.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={q} {...revealUp(Math.min(i * 0.05, 0.3), 10)}>
              <button
                type="button"
                className="ts-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {q}
                <motion.em animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: revealEase }}>+</motion.em>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: revealEase }}
                    style={{ overflow: "hidden" }}
                  >
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function CtaBand({ content }: { content: LandingContent }) {
  const { cta } = content;
  return (
    <section className="ts-ctab">
      <RevealHeading as="h2">{cta.heading}</RevealHeading>
      <motion.p {...revealUp(0.1)}>
        {cta.body}
      </motion.p>
      <motion.div className="ts-row" {...revealUp(0.2)}>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-w">{cta.primary}</button>
        </MagneticButton>
        <MagneticButton strength={0.25}>
          <button className="ts-btn ts-o">{cta.secondary}</button>
        </MagneticButton>
      </motion.div>
    </section>
  );
}

function Footer({ content }: { content: LandingContent }) {
  const { footer: f } = content;
  return (
    <footer>
      <div className="ts-wrap">
        <motion.div className="ts-ftop" {...revealUp(0, 16)}>
          <div className="ts-fb">
            <div className="ts-brand"><i />TalentSnaps</div>
            <p>
              {f.brandLine1}<br />
              {f.brandLine2}
            </p>
          </div>
          <div className="ts-contact" id="ts-contact-form">
            <b>{f.contactHeading}</b>
            <div className="ts-f">
              <input id="ts-femail" type="email" placeholder="Your college email" aria-label="Your college email" />
              <MagneticButton strength={0.2}>
                <button className="ts-btn ts-btn-p" style={{ padding: "12px 20px", fontSize: 14 }}>Book a demo</button>
              </MagneticButton>
            </div>
            <small>{f.contactEmail}</small>
          </div>
        </motion.div>

        <div className="ts-fcols">
          {f.columns.map(({ head, items }) => (
            <div key={head}>
              <h4>{head}</h4>
              <ul>
                {items.map((i) =>
                  typeof i === "string" ? (
                    <li key={i}>{i}</li>
                  ) : (
                    <li key={i.href}><Link href={i.href}>{i.label}</Link></li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="ts-fbar">
          <span>© 2026 TalentSnaps. All rights reserved.</span>
          <div className="ts-m">
            {f.tagline.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function ClosingScene({ monsoon = false }: { monsoon?: boolean }) {
  return (
    <motion.div
      className="ts-scene ts-closing-scene"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1 }}
    >
      <LandscapeArt />
      {monsoon && <MonsoonOverlay />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function TalentSnapsLanding({ content = ROOT_CONTENT }: { content?: LandingContent }) {
  return (
    <div className="ts-landing">
      <Hero content={content} />
      <HeroScene monsoon={content.monsoon}><Dashboard content={content} /></HeroScene>
      <TrustedByColleges />
      <Modules content={content} />
      <DrivesFeature content={content} />
      <OfferLettersFeature content={content} />
      <SkillReport content={content} />
      <DataBand content={content} />
      <Numbers content={content} />
      <Faq content={content} />
      <CtaBand content={content} />
      <Footer content={content} />
      <ClosingScene monsoon={content.monsoon} />
    </div>
  );
}
