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
  /** The gradient's own first stop — used behind the moon's crescent cutout
      so it blends with the sky instead of reading as a mountain-colour bite. */
  skyTop: string;
  far: string;
  mid: string;
  near: string;
  farOpacity: number;
  midOpacity: number;
  snow: string;
  snowOpacity: number;
  /** "day" shows a real sun; "night" shows a moon, stars, and clouds. */
  sky: "day" | "night";
  sun: string;
  sunCore: string;
  /** Small drifting accents: stars (night), petals/leaves/pollen (day). */
  accent: string;
  accentOpacity: number;
};

const PALETTES: Record<AuthSeason, Palette> = {
  spring: {
    bg: "linear-gradient(150deg, #4A2E52 0%, #8B5A8F 45%, #C98FB0 80%, #F5C6D8 100%)",
    skyTop: "#4A2E52",
    far: "#B37FA8", mid: "#8C5090", near: "#5C2E5E",
    farOpacity: 0.5, midOpacity: 0.75,
    snow: "#FCE4EF", snowOpacity: 0.7,
    sky: "day", sun: "#FFE3F1", sunCore: "#FFFFFF",
    accent: "#FCE4EF", accentOpacity: 0.65,
  },
  summer: {
    bg: "linear-gradient(150deg, #0B3D24 0%, #1C7A4C 45%, #4CAF6E 80%, #A8DDB5 100%)",
    skyTop: "#0B3D24",
    far: "#6FAE85", mid: "#2F8557", near: "#0F4A2C",
    farOpacity: 0.5, midOpacity: 0.78,
    snow: "#EAF9EE", snowOpacity: 0.6,
    sky: "day", sun: "#FFF6C9", sunCore: "#FFFFFF",
    accent: "#EAF9EE", accentOpacity: 0.5,
  },
  autumn: {
    bg: "linear-gradient(150deg, #6B2A10 0%, #B54A18 45%, #D97B2B 80%, #F0B860 100%)",
    skyTop: "#6B2A10",
    far: "#C77A44", mid: "#9C4E22", near: "#5E2A10",
    farOpacity: 0.5, midOpacity: 0.78,
    snow: "#FDE8C9", snowOpacity: 0.5,
    sky: "day", sun: "#FFD98A", sunCore: "#FFF3D6",
    accent: "#E8934B", accentOpacity: 0.8,
  },
  winter: {
    bg: "linear-gradient(150deg, #17324A 0%, #3E6B96 45%, #6FA3C7 80%, #C8E6F5 100%)",
    skyTop: "#17324A",
    far: "#7FA9C4", mid: "#4C7EA0", near: "#1F425E",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#FFFFFF", snowOpacity: 0.9,
    sky: "night", sun: "#F3FAFF", sunCore: "#FFFFFF",
    accent: "#FFFFFF", accentOpacity: 0.8,
  },
  night: {
    bg: "linear-gradient(150deg, #002457 0%, #0B408B 45%, #0056D2 80%, #5B9DFC 100%)",
    skyTop: "#002457",
    far: "#15458F", mid: "#0D3272", near: "#081F4D",
    farOpacity: 0.55, midOpacity: 0.8,
    snow: "#E8F0FF", snowOpacity: 0.5,
    sky: "night", sun: "#EAF2FF", sunCore: "#FFFFFF",
    accent: "#fff", accentOpacity: 0.75,
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
  // Soft, rounded peaks — real mountain relief, just with smooth curved
  // summits instead of winter/night's sharp triangular ones. One tall
  // central peak flanked by smaller rounded ones, unlike summer's evenly
  // separated domes or autumn's dense tiny bumps.
  spring: {
    far: "M0 250 C 25 210 45 195 70 200 C 95 205 105 235 130 225 C 155 215 175 160 205 165 C 235 170 250 225 280 220 C 310 215 325 180 355 185 C 385 190 400 220 420 215 L420 380 L0 380 Z",
    mid: "M0 280 C 30 245 55 230 80 235 C 105 240 115 265 140 258 C 165 251 185 205 215 210 C 245 215 260 260 290 255 C 320 250 335 220 365 225 C 390 230 405 255 420 250 L420 380 L0 380 Z",
    near: "M0 315 C 35 275 65 258 95 264 C 125 270 138 300 168 292 C 198 284 220 230 255 236 C 290 242 308 295 343 289 C 373 283 390 250 420 258 L420 380 L0 380 Z",
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

// The night sky's star field — fixed positions and fixed twinkle timing
// (not Math.random()) so server and client render identical markup, but
// varied enough per star that the sparkle reads as random rather than a
// single synchronized pulse. `o` is a multiplier on the palette's own
// accentOpacity, `dur`/`delay` stagger each star's twinkle cycle.
const STARS = [
  { cx: 54, cy: 40, r: 1.6, o: 1, dur: 3.4, delay: -0.6 },
  { cx: 128, cy: 70, r: 1.1, o: 0.65, dur: 4.1, delay: -2.4 },
  { cx: 96, cy: 105, r: 1.3, o: 0.75, dur: 2.9, delay: -1.1 },
  { cx: 18, cy: 80, r: 1.2, o: 0.6, dur: 3.8, delay: -3 },
  { cx: 70, cy: 150, r: 1.1, o: 0.55, dur: 2.6, delay: -0.3 },
  { cx: 160, cy: 40, r: 1.3, o: 0.7, dur: 4.4, delay: -1.8 },
  { cx: 200, cy: 95, r: 1, o: 0.5, dur: 3.1, delay: -2.1 },
  { cx: 248, cy: 30, r: 1.2, o: 0.55, dur: 3.6, delay: -0.9 },
  { cx: 270, cy: 110, r: 1.4, o: 0.7, dur: 2.7, delay: -1.5 },
  { cx: 368, cy: 94, r: 1.4, o: 0.75, dur: 4, delay: -2.7 },
  { cx: 30, cy: 140, r: 1.1, o: 0.55, dur: 3.3, delay: -1.2 },
  { cx: 395, cy: 150, r: 1.2, o: 0.6, dur: 2.8, delay: -3.3 },
  { cx: 8, cy: 30, r: 1, o: 0.5, dur: 3.9, delay: -0.5 },
  { cx: 230, cy: 150, r: 1.1, o: 0.5, dur: 3.2, delay: -2.9 },
  { cx: 110, cy: 20, r: 1, o: 0.6, dur: 4.2, delay: -1.6 },
  { cx: 150, cy: 120, r: 1.2, o: 0.65, dur: 2.6, delay: -0.8 },
  { cx: 185, cy: 55, r: 1.1, o: 0.5, dur: 3.5, delay: -2.2 },
  { cx: 220, cy: 15, r: 1.3, o: 0.6, dur: 3, delay: -1.4 },
  { cx: 260, cy: 145, r: 1, o: 0.55, dur: 4.3, delay: -3.1 },
  { cx: 290, cy: 50, r: 1.2, o: 0.7, dur: 2.9, delay: -0.4 },
  { cx: 315, cy: 130, r: 1.1, o: 0.5, dur: 3.7, delay: -2.5 },
  { cx: 350, cy: 25, r: 1.3, o: 0.65, dur: 3.1, delay: -1.9 },
  { cx: 380, cy: 60, r: 1, o: 0.55, dur: 4, delay: -0.7 },
  { cx: 405, cy: 110, r: 1.2, o: 0.6, dur: 2.7, delay: -2.6 },
  { cx: 45, cy: 115, r: 1, o: 0.5, dur: 3.6, delay: -1.3 },
  { cx: 75, cy: 25, r: 1.1, o: 0.6, dur: 3.2, delay: -3.2 },
  { cx: 135, cy: 150, r: 1, o: 0.5, dur: 4.1, delay: -0.2 },
  { cx: 175, cy: 155, r: 1.2, o: 0.55, dur: 2.8, delay: -1.7 },
  { cx: 250, cy: 70, r: 1, o: 0.5, dur: 3.4, delay: -2.8 },
  { cx: 300, cy: 20, r: 1.1, o: 0.6, dur: 3.9, delay: -1, },
];

// Fixed-position, fixed-timing streaks (not Math.random()) so server and
// client render identical markup — a real streak across the sky every few
// seconds, not a static decoration.
const SHOOTING_STARS = [
  { x1: 40, y1: 30, x2: 92, y2: 52, dx: 150, dy: 65, duration: 7, delay: -1 },
  { x1: 210, y1: 18, x2: 258, y2: 40, dx: 128, dy: 55, duration: 9.5, delay: -4.2 },
  { x1: 305, y1: 62, x2: 352, y2: 83, dx: 108, dy: 46, duration: 6.5, delay: -2.7 },
  { x1: 130, y1: 90, x2: 178, y2: 112, dx: 118, dy: 50, duration: 8.5, delay: -6 },
];

// A handful of falling snow particles, drifting side to side as they fall —
// only used for the winter scene's overlay (see `Snowfall` below).
const SNOWFLAKES = [
  { left: 4, size: 3, duration: 9, delay: -1, drift: 18 },
  { left: 12, size: 2, duration: 12, delay: -6, drift: -22 },
  { left: 20, size: 4, duration: 8, delay: -3, drift: 12 },
  { left: 28, size: 2.5, duration: 14, delay: -9, drift: -16 },
  { left: 35, size: 3, duration: 10, delay: -2, drift: 24 },
  { left: 43, size: 2, duration: 13, delay: -7, drift: -10 },
  { left: 50, size: 3.5, duration: 9, delay: -4, drift: 20 },
  { left: 58, size: 2, duration: 11, delay: -8, drift: -18 },
  { left: 65, size: 3, duration: 15, delay: -5, drift: 14 },
  { left: 72, size: 2.5, duration: 10, delay: -1, drift: -24 },
  { left: 80, size: 4, duration: 12, delay: -10, drift: 16 },
  { left: 88, size: 2, duration: 9, delay: -3, drift: -12 },
  { left: 95, size: 3, duration: 13, delay: -6, drift: 22 },
  { left: 8, size: 2, duration: 16, delay: -11, drift: -20 },
  { left: 16, size: 3.5, duration: 8, delay: -2, drift: 10 },
  { left: 24, size: 2, duration: 11, delay: -9, drift: -14 },
  { left: 32, size: 3, duration: 14, delay: -4, drift: 18 },
  { left: 40, size: 2.5, duration: 9, delay: -7, drift: -22 },
  { left: 48, size: 4, duration: 12, delay: -1, drift: 12 },
  { left: 55, size: 2, duration: 10, delay: -5, drift: -16 },
  { left: 63, size: 3, duration: 15, delay: -8, drift: 20 },
  { left: 70, size: 2.5, duration: 13, delay: -2, drift: -10 },
  { left: 78, size: 3, duration: 9, delay: -6, drift: 24 },
  { left: 85, size: 2, duration: 11, delay: -3, drift: -18 },
  { left: 92, size: 3.5, duration: 14, delay: -10, drift: 14 },
  { left: 98, size: 2, duration: 8, delay: -4, drift: -12 },
];

// Winter-only snow overlay, layered above AuthMountains in AuthSplitLayout
// so it falls across the full panel height, not just the mountain SVG's
// masked bottom band.
export function Snowfall() {
  return (
    <div className="lp-snow" aria-hidden="true">
      {SNOWFLAKES.map((f, i) => (
        <span
          key={i}
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            ["--drift" as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// A puffy cartoon-cloud silhouette: a cluster of overlapping ellipses,
// anchored at (x, y) and scaled by `s`. Same shape reused at different
// positions/sizes/opacities for variety.
function Cloud({ x, y, s = 1, fill, opacity }: { x: number; y: number; s?: number; fill: string; opacity: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="0" cy="0" rx="26" ry="12" />
      <ellipse cx="-16" cy="3" rx="16" ry="9" />
      <ellipse cx="16" cy="3" rx="18" ry="10" />
      <ellipse cx="0" cy="-6" rx="15" ry="10" />
    </g>
  );
}

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
      <defs>
        <linearGradient id="lp-shoot-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* live shooting stars — a real streak crossing the sky every few
          seconds, independent of day/night palette */}
      {SHOOTING_STARS.map((star, i) => (
        <line
          key={i}
          x1={star.x1}
          y1={star.y1}
          x2={star.x2}
          y2={star.y2}
          stroke="url(#lp-shoot-trail)"
          strokeWidth="2"
          strokeLinecap="round"
          className="lp-shoot"
          style={{
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            ["--dx" as string]: `${star.dx}px`,
            ["--dy" as string]: `${star.dy}px`,
          }}
        />
      ))}

      {p.sky === "night" ? (
        <>
          {/* stars — a full field, each twinkling on its own random-feeling cycle */}
          {STARS.map((st, i) => (
            <circle
              key={i}
              cx={st.cx}
              cy={st.cy}
              r={st.r}
              fill={p.accent}
              className="lp-star"
              style={{
                ["--o" as string]: p.accentOpacity * st.o,
                animationDuration: `${st.dur}s`,
                animationDelay: `${st.delay}s`,
              }}
            />
          ))}

          {/* half moon: a full pale disc with an offset "shadow" disc, filled
              with the sky's own top colour so the cutout reads as a true
              crescent against the gradient rather than a grey bite. */}
          <circle cx="330" cy="66" r="26" fill={p.sun} />
          <circle cx="341" cy="58" r="24" fill={p.skyTop} />

          {/* clouds drifting past, lower and further from the moon than the stars */}
          <Cloud x={90} y={210} s={1.15} fill="#fff" opacity={0.14} />
          <Cloud x={300} y={175} s={0.85} fill="#fff" opacity={0.12} />
          <Cloud x={190} y={245} s={0.7} fill="#fff" opacity={0.1} />
        </>
      ) : (
        <>
          {/* a real, clearly visible sun — soft outer glow, bright core */}
          <circle cx="332" cy="66" r="56" fill={p.sun} opacity=".22" />
          <circle cx="332" cy="66" r="38" fill={p.sun} opacity=".45" />
          <circle cx="332" cy="66" r="24" fill={p.sunCore} opacity=".95" />

          {/* drifting accents — petals (spring), pollen (summer), leaves (autumn) */}
          <circle cx="54" cy="86" r="2.4" fill={p.accent} opacity={p.accentOpacity} />
          <circle cx="128" cy="128" r="1.8" fill={p.accent} opacity={p.accentOpacity * 0.7} />
          <circle cx="96" cy="162" r="2" fill={p.accent} opacity={p.accentOpacity * 0.8} />
          <circle cx="248" cy="112" r="1.7" fill={p.accent} opacity={p.accentOpacity * 0.6} />
          <circle cx="200" cy="150" r="2.2" fill={p.accent} opacity={p.accentOpacity * 0.75} />
          <circle cx="30" cy="180" r="1.6" fill={p.accent} opacity={p.accentOpacity * 0.6} />

          {/* clouds, soft and pale against the day sky */}
          <Cloud x={110} y={70} s={1} fill="#fff" opacity={0.22} />
          <Cloud x={220} y={130} s={0.75} fill="#fff" opacity={0.16} />
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
