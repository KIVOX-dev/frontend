// Decorative mountain silhouette for AuthSplitLayout's left panel. Pure
// SVG, no dependencies. One shared ridge-line geometry, recoloured and
// re-dressed (moon vs sun, snow vs blossoms vs leaves) per `season` — so
// each login screen (learner, HR, institutional, super admin) reads as its
// own distinct place rather than five copies of the same night scene.
export type AuthSeason = "spring" | "summer" | "autumn" | "winter" | "night";

type Palette = {
  /** Background gradient for AuthSplitLayout's `.lp-left` panel. */
  bg: string;
  far: string;
  mid: string;
  near: string;
  farOpacity: number;
  midOpacity: number;
  snow: string;
  snowOpacity: number;
  /** "day" shows a sun glow; "night" shows a moon and stars. */
  sky: "day" | "night";
  sun: string;
  /** Small drifting accents: stars (night), petals (spring), motes (others). */
  accent: string;
  accentOpacity: number;
};

const PALETTES: Record<AuthSeason, Palette> = {
  spring: {
    bg: "linear-gradient(150deg, #4A2E52 0%, #8B5A8F 45%, #C98FB0 80%, #F5C6D8 100%)",
    far: "#B37FA8", mid: "#8C5090", near: "#5C2E5E",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#FCE4EF", snowOpacity: 0.7,
    sky: "day", sun: "#FBD3E4",
    accent: "#FCE4EF", accentOpacity: 0.65,
  },
  summer: {
    bg: "linear-gradient(150deg, #0B3D24 0%, #1C7A4C 45%, #4CAF6E 80%, #A8DDB5 100%)",
    far: "#6FAE85", mid: "#2F8557", near: "#0F4A2C",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#EAF9EE", snowOpacity: 0.6,
    sky: "day", sun: "#DFF6E8",
    accent: "#EAF9EE", accentOpacity: 0.5,
  },
  autumn: {
    bg: "linear-gradient(150deg, #6B2A10 0%, #B54A18 45%, #D97B2B 80%, #F0B860 100%)",
    far: "#C77A44", mid: "#9C4E22", near: "#5E2A10",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#FDE8C9", snowOpacity: 0.5,
    sky: "day", sun: "#FBDCA0",
    accent: "#E8934B", accentOpacity: 0.8,
  },
  winter: {
    bg: "linear-gradient(150deg, #17324A 0%, #3E6B96 45%, #6FA3C7 80%, #C8E6F5 100%)",
    far: "#7FA9C4", mid: "#4C7EA0", near: "#1F425E",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#FFFFFF", snowOpacity: 0.85,
    sky: "day", sun: "#E7F4FC",
    accent: "#FFFFFF", accentOpacity: 0.85,
  },
  night: {
    bg: "linear-gradient(150deg, #002457 0%, #0B408B 45%, #0056D2 80%, #5B9DFC 100%)",
    far: "#15458F", mid: "#0D3272", near: "#081F4D",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#E8F0FF", snowOpacity: 0.5,
    sky: "night", sun: "#EAF2FF",
    accent: "#fff", accentOpacity: 0.4,
  },
};

export function AuthMountains({ season = "night" }: { season?: AuthSeason }) {
  const p = PALETTES[season];
  return (
    <svg
      className="lp-mountains"
      viewBox="0 0 420 380"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {p.sky === "night" ? (
        <>
          {/* stars */}
          <circle cx="54" cy="46" r="1.6" fill={p.accent} opacity={p.accentOpacity} />
          <circle cx="128" cy="78" r="1.1" fill={p.accent} opacity={p.accentOpacity * 0.65} />
          <circle cx="96" cy="112" r="1.3" fill={p.accent} opacity={p.accentOpacity * 0.75} />
          <circle cx="248" cy="52" r="1.2" fill={p.accent} opacity={p.accentOpacity * 0.55} />
          <circle cx="368" cy="94" r="1.4" fill={p.accent} opacity={p.accentOpacity * 0.75} />
          <circle cx="30" cy="140" r="1.1" fill={p.accent} opacity={p.accentOpacity * 0.55} />
          {/* moon */}
          <circle cx="322" cy="70" r="24" fill={p.sun} opacity=".92" />
          <circle cx="331" cy="62" r="21" fill={p.mid} opacity=".65" />
        </>
      ) : (
        <>
          {/* sun / soft glow */}
          <circle cx="332" cy="68" r="34" fill={p.sun} opacity=".5" />
          <circle cx="332" cy="68" r="20" fill={p.sun} opacity=".85" />
          {/* drifting accents — petals (spring), leaves (autumn), pollen (summer), snow (winter) */}
          <circle cx="54" cy="86" r="2.4" fill={p.accent} opacity={p.accentOpacity} />
          <circle cx="128" cy="128" r="1.8" fill={p.accent} opacity={p.accentOpacity * 0.7} />
          <circle cx="96" cy="162" r="2" fill={p.accent} opacity={p.accentOpacity * 0.8} />
          <circle cx="248" cy="112" r="1.7" fill={p.accent} opacity={p.accentOpacity * 0.6} />
          <circle cx="200" cy="150" r="2.2" fill={p.accent} opacity={p.accentOpacity * 0.75} />
          <circle cx="30" cy="180" r="1.6" fill={p.accent} opacity={p.accentOpacity * 0.6} />
        </>
      )}

      {/* far ridge */}
      <path
        d="M0 220 L45 178 L95 208 L150 158 L205 202 L265 168 L320 206 L375 172 L420 198 L420 380 L0 380 Z"
        fill={p.far}
        opacity={p.farOpacity}
      />
      {/* mid ridge */}
      <path
        d="M0 258 L55 214 L115 248 L180 194 L235 244 L295 202 L350 246 L420 220 L420 380 L0 380 Z"
        fill={p.mid}
        opacity={p.midOpacity}
      />
      {/* near ridge, with a couple of pale snow caps to echo the landing page's mountains */}
      <path
        d="M0 300 L50 254 L100 284 L165 226 L220 278 L285 236 L345 282 L420 254 L420 380 L0 380 Z"
        fill={p.near}
      />
      <path d="M165 226 L178 244 L152 244 Z" fill={p.snow} opacity={p.snowOpacity} />
      <path d="M285 236 L297 253 L273 253 Z" fill={p.snow} opacity={p.snowOpacity * 0.8} />
    </svg>
  );
}
