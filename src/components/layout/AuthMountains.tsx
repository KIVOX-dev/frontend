// Decorative mountain silhouette for AuthSplitLayout's left panel. Pure
// SVG, no dependencies. Each season gets both its own palette AND its own
// ridge-line geometry — sharp icy peaks for winter/night, soft rolling
// hills for spring/summer, clustered tree-canopy hills for autumn — so the
// five login screens read as five different places, not one scene recolored
// five times.
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
    farOpacity: 0.5, midOpacity: 0.75,
    snow: "#FCE4EF", snowOpacity: 0.7,
    sky: "day", sun: "#FBD3E4",
    accent: "#FCE4EF", accentOpacity: 0.65,
  },
  summer: {
    bg: "linear-gradient(150deg, #0B3D24 0%, #1C7A4C 45%, #4CAF6E 80%, #A8DDB5 100%)",
    far: "#6FAE85", mid: "#2F8557", near: "#0F4A2C",
    farOpacity: 0.5, midOpacity: 0.78,
    snow: "#EAF9EE", snowOpacity: 0.6,
    sky: "day", sun: "#DFF6E8",
    accent: "#EAF9EE", accentOpacity: 0.5,
  },
  autumn: {
    bg: "linear-gradient(150deg, #6B2A10 0%, #B54A18 45%, #D97B2B 80%, #F0B860 100%)",
    far: "#C77A44", mid: "#9C4E22", near: "#5E2A10",
    farOpacity: 0.5, midOpacity: 0.78,
    snow: "#FDE8C9", snowOpacity: 0.5,
    sky: "day", sun: "#FBDCA0",
    accent: "#E8934B", accentOpacity: 0.8,
  },
  winter: {
    bg: "linear-gradient(150deg, #17324A 0%, #3E6B96 45%, #6FA3C7 80%, #C8E6F5 100%)",
    far: "#7FA9C4", mid: "#4C7EA0", near: "#1F425E",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#FFFFFF", snowOpacity: 0.9,
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

type Shape = {
  far: string;
  mid: string;
  near: string;
  /** Small triangular caps on the tallest near-ridge peaks — sharp seasons only. */
  caps?: string[];
};

const SHAPES: Record<AuthSeason, Shape> = {
  // Sharp, dramatic alpine skyline — tall single peaks, wide gaps.
  night: {
    far: "M0 220 L45 178 L95 208 L150 158 L205 202 L265 168 L320 206 L375 172 L420 198 L420 380 L0 380 Z",
    mid: "M0 258 L55 214 L115 248 L180 194 L235 244 L295 202 L350 246 L420 220 L420 380 L0 380 Z",
    near: "M0 300 L50 254 L100 284 L165 226 L220 278 L285 236 L345 282 L420 254 L420 380 L0 380 Z",
    caps: ["M165 226 L178 244 L152 244 Z", "M285 236 L297 253 L273 253 Z"],
  },
  // Sharper and more frequent peaks than night — a jagged icefield, heavy snow.
  winter: {
    far: "M0 240 L30 190 L60 220 L90 170 L120 210 L150 160 L180 205 L210 155 L240 200 L270 165 L300 210 L330 170 L360 215 L390 175 L420 205 L420 380 L0 380 Z",
    mid: "M0 270 L40 220 L80 255 L125 200 L165 245 L210 195 L250 240 L295 190 L335 235 L375 200 L420 230 L420 380 L0 380 Z",
    near: "M0 312 L45 255 L90 292 L140 222 L185 278 L235 218 L285 274 L335 228 L385 278 L420 244 L420 380 L0 380 Z",
    caps: [
      "M140 222 L152 244 L128 244 Z",
      "M235 218 L247 240 L223 240 Z",
      "M335 228 L347 249 L323 249 Z",
    ],
  },
  // Calm, almost-flat wave — barely any relief, the gentlest of the five.
  spring: {
    far: "M0 270 C 100 240 200 252 300 232 C 350 222 390 228 420 232 L420 380 L0 380 Z",
    mid: "M0 300 C 100 275 200 285 300 268 C 350 260 390 264 420 268 L420 380 L0 380 Z",
    near: "M0 330 C 100 310 200 320 300 305 C 350 298 390 302 420 305 L420 380 L0 380 Z",
  },
  // A few big, separate rounded dome hills with real valleys between them —
  // reads as distinct hills, not one continuous wave.
  summer: {
    far: "M0 280 C 40 232 80 212 120 212 C 160 212 180 255 220 255 C 260 255 280 202 320 202 C 360 202 380 248 420 248 L420 380 L0 380 Z",
    mid: "M0 310 C 35 265 75 245 115 245 C 155 245 175 288 215 288 C 255 288 275 235 315 235 C 355 235 375 280 415 280 L420 282 L420 380 L0 380 Z",
    near: "M0 340 C 30 300 70 280 110 280 C 150 280 170 320 210 320 C 250 320 270 270 310 270 C 350 270 370 315 410 315 L420 318 L420 380 L0 380 Z",
  },
  // A dense field of small, tight bumps — a forest-canopy texture, distinct
  // from summer's few big domes and spring's flat wave.
  autumn: {
    far: "M0 260 C 15 238 30 250 45 240 C 60 230 75 246 90 238 C 105 230 120 248 135 240 C 150 232 165 248 180 240 C 195 232 210 248 225 240 C 240 232 255 248 270 240 C 285 232 300 246 315 238 C 330 230 345 244 360 236 C 375 228 390 240 405 234 L420 238 L420 380 L0 380 Z",
    mid: "M0 292 C 18 266 35 280 52 270 C 69 260 86 278 103 268 C 120 258 137 278 154 268 C 171 258 188 278 205 268 C 222 258 239 278 256 268 C 273 258 290 276 307 266 C 324 256 341 272 358 262 C 375 252 392 266 409 258 L420 262 L420 380 L0 380 Z",
    near: "M0 335 C 20 306 38 322 56 310 C 74 298 92 320 110 308 C 128 296 146 320 164 308 C 182 296 200 320 218 308 C 236 296 254 320 272 308 C 290 296 308 318 326 306 C 344 294 362 312 380 302 C 392 295 402 300 410 298 L420 302 L420 380 L0 380 Z",
  },
};

export function AuthMountains({ season = "night" }: { season?: AuthSeason }) {
  const p = PALETTES[season];
  const s = SHAPES[season];
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

      <path d={s.far} fill={p.far} opacity={p.farOpacity} />
      <path d={s.mid} fill={p.mid} opacity={p.midOpacity} />
      <path d={s.near} fill={p.near} />
      {s.caps?.map((d, i) => (
        <path key={i} d={d} fill={p.snow} opacity={p.snowOpacity * (i === 0 ? 1 : 0.85)} />
      ))}
    </svg>
  );
}
