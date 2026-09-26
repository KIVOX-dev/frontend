import type { CSSProperties, ElementType, ReactNode } from "react";

/** Inline SVG sprite for every <Icon>; rendered once by CampusShell. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="i-megaphone" viewBox="0 0 24 24">
          <path d="M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1Z"></path>
          <path d="M7 15v4"></path>
          <path d="M18 9a4 4 0 0 1 0 6"></path>
        </symbol>
        <symbol id="i-files" viewBox="0 0 24 24">
          <path d="M8 3h7l4 4v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"></path>
          <path d="M15 3v4h4"></path>
          <path d="M4 7v13a1 1 0 0 0 1 1h10"></path>
        </symbol>
        <symbol id="i-funnel" viewBox="0 0 24 24">
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"></path>
        </symbol>
        <symbol id="i-steps" viewBox="0 0 24 24">
          <path d="M3 19h5v-5h5V9h5V4h3"></path>
        </symbol>
        <symbol id="i-seal" viewBox="0 0 24 24">
          <path d="M12 3l2.2 1.6 2.7-.1.9 2.6 2.2 1.6-.8 2.6.8 2.6-2.2 1.6-.9 2.6-2.7-.1L12 21l-2.2-1.6-2.7.1-.9-2.6L4 15.3l.8-2.6L4 10.1l2.2-1.6.9-2.6 2.7.1L12 3Z"></path>
          <path d="m9 12 2 2 4-4"></path>
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m8.5 12.5 2.3 2.3 4.7-5"></path>
        </symbol>
        <symbol id="i-tick" viewBox="0 0 24 24">
          <path d="m5 12.5 4.5 4.5L19 7.5"></path>
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m9 9 6 6M15 9l-6 6"></path>
        </symbol>
        <symbol id="i-house" viewBox="0 0 24 24">
          <path d="M4 11 12 4l8 7"></path>
          <path d="M6 10v10h12V10"></path>
        </symbol>
        <symbol id="i-chart" viewBox="0 0 24 24">
          <path d="M4 20V4"></path>
          <path d="M4 20h16"></path>
          <path d="M8 16v-4"></path>
          <path d="M12 16V8"></path>
          <path d="M16 16v-6"></path>
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"></path>
        </symbol>
        <symbol id="i-users" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3.5"></circle>
          <path d="M2.5 20c1.2-3.5 3.7-5.5 6.5-5.5s5.3 2 6.5 5.5"></path>
          <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4"></path>
          <path d="M18 14.8c1.7.8 2.9 2.5 3.5 5.2"></path>
        </symbol>
        <symbol id="i-brief" viewBox="0 0 24 24">
          <rect x="3" y="7" width="18" height="13" rx="1.5"></rect>
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          <path d="M3 12h18"></path>
        </symbol>
        <symbol id="i-building" viewBox="0 0 24 24">
          <path d="M3 21h18"></path>
          <path d="M5 21V8l7-4 7 4v13"></path>
          <path d="M9 21v-5a3 3 0 0 1 6 0v5"></path>
        </symbol>
        <symbol id="i-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"></path>
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14"></path>
          <path d="m13 6 6 6-6 6"></path>
        </symbol>
        <symbol id="i-upload" viewBox="0 0 24 24">
          <path d="M12 16V4"></path>
          <path d="m7 9 5-5 5 5"></path>
          <path d="M4 20h16"></path>
        </symbol>
        <symbol id="i-download" viewBox="0 0 24 24">
          <path d="M12 4v11"></path>
          <path d="m7 10 5 5 5-5"></path>
          <path d="M4 20h16"></path>
        </symbol>
        <symbol id="i-target" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="5"></circle>
          <circle cx="12" cy="12" r="1"></circle>
        </symbol>
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"></path>
          <path d="M10 20a2 2 0 0 0 4 0"></path>
        </symbol>
        <symbol id="i-send" viewBox="0 0 24 24">
          <path d="M21 3 10 14"></path>
          <path d="M21 3 14 21l-4-7-7-4 18-7Z"></path>
        </symbol>
        <symbol id="i-grip" viewBox="0 0 24 24">
          <circle cx="9" cy="7" r=".8"></circle>
          <circle cx="15" cy="7" r=".8"></circle>
          <circle cx="9" cy="12" r=".8"></circle>
          <circle cx="15" cy="12" r=".8"></circle>
          <circle cx="9" cy="17" r=".8"></circle>
          <circle cx="15" cy="17" r=".8"></circle>
        </symbol>
        <symbol id="i-cal" viewBox="0 0 24 24">
          <rect x="3.5" y="5" width="17" height="15" rx="1.5"></rect>
          <path d="M3.5 10h17M8 3v4M16 3v4"></path>
        </symbol>
        <symbol id="i-star" viewBox="0 0 24 24">
          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"></path>
        </symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className ? `ico ${className}` : "ico"} style={style} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** The long arrow on the "Next: …" links. */
export function MoreArrow() {
  return (
    <svg viewBox="0 0 38 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M0 7h36M30 1l6 6-6 6" />
    </svg>
  );
}

/**
 * Display headline whose words rise out of a mask on reveal. Each word gets
 * its own --w index for the stagger; the optional "//" prefix counts as word 0.
 */
export function Split({
  as: Tag = "h2",
  className,
  slash,
  style,
  children,
}: {
  as?: ElementType;
  className?: string;
  slash?: boolean;
  style?: CSSProperties;
  children: string;
}) {
  let w = 0;
  const word = (text: string) => (
    <span className="ln" key={w}>
      <span style={{ "--w": w++ }}>{text}</span>
    </span>
  );
  const prefix = slash ? <span className="slash">{word("//")}</span> : null;
  const words: ReactNode[] = [];
  children.split(/\s+/).forEach((tok, i) => {
    if (i > 0) words.push(" ");
    words.push(word(tok));
  });
  return (
    <Tag className={className} style={style}>
      {prefix}
      {words}
    </Tag>
  );
}

/** Oversized footer wordmark, one span per letter for the staggered rise. */
export function FooterWord({ text }: { text: string }) {
  return (
    <div className="fword" aria-hidden="true">
      {Array.from(text).map((c, i) => (
        <span key={i} style={{ "--w": i }}>
          {c}
        </span>
      ))}
    </div>
  );
}

// Institutions dashboard chart: cumulative students placed, drawn to scale.
const TREND: [string, number][] = [
  ["Jul", 18],
  ["Aug", 64],
  ["Sep", 142],
  ["Oct", 231],
  ["Nov", 318],
  ["Dec", 386],
];

export function TrendChart() {
  const W = 360,
    H = 170,
    L = 34,
    R = 10,
    T = 12,
    B = 26,
    max = 400;
  const x = (i: number) => L + (i * (W - L - R)) / (TREND.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const pts = TREND.map(([, v], i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `M${pts[0]} L${pts.join(" L")} L${x(TREND.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = TREND[TREND.length - 1][1];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Students placed by month, rising from 18 in July to 386 in December">
        {[0, 100, 200, 300, 400].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgb(6 38 43 / .08)" strokeWidth="1" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6E7E7F">
              {v}
            </text>
          </g>
        ))}
        {TREND.map(([m], i) => (
          <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6E7E7F">
            {m}
          </text>
        ))}
        <path d={area} fill="#0563F9" opacity=".1" />
        <path
          className="ln"
          d={`M${pts.join(" L")}`}
          fill="none"
          stroke="#0563F9"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={x(TREND.length - 1)} cy={y(last)} r="4.5" fill="#0563F9" stroke="#fff" strokeWidth="2" />
        <text x={x(TREND.length - 1) - 8} y={y(last) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill="#06262B">
          {last}
        </text>
      </svg>
    </div>
  );
}
