// Decorative mountain range for AuthSplitLayout's left panel. Pure SVG, no
// dependencies. Each season has its own palette and its own procedurally
// generated terrain (see TERRAIN below) — tall snow-capped alpine peaks for
// night/winter/spring, lower forested ranges for summer/autumn/monsoon — so
// the login screens read as different places, not one scene recoloured.
export type AuthSeason = "spring" | "summer" | "autumn" | "winter" | "night" | "monsoon";

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
  /** "day" shows a real sun; "night" shows a moon, stars, and clouds; "storm"
      (monsoon) shows heavy rain clouds with the sun barely visible behind
      them, plus falling rain. */
  sky: "day" | "night" | "storm";
  sun: string;
  sunCore: string;
  /** Small drifting accents: stars (night), petals/leaves/pollen (day),
      rain streaks (storm). */
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
  monsoon: {
    bg: "linear-gradient(150deg, #1F2C2A 0%, #35504A 45%, #4C6F63 80%, #8FAA98 100%)",
    skyTop: "#1F2C2A",
    far: "#6C8B7C", mid: "#3F5F52", near: "#233B31",
    farOpacity: 0.55, midOpacity: 0.82,
    snow: "#E4EFE7", snowOpacity: 0.3,
    sky: "storm", sun: "#B9C9BD", sunCore: "#D6E3D9",
    accent: "#D7E6EC", accentOpacity: 0.55,
  },
};

// ── Procedural mountain terrain ─────────────────────────────────────────────
// Ridgelines are generated (ridged fractal noise), not hand-drawn, so they
// read as real mountains: sharp peaks, rounded valleys, fine-grained
// jaggedness. Everything is derived from a fixed seed with plain arithmetic
// (no Math.random, no trig) so server and client render identical markup.
// Each peak also gets a lit face (towards the sun, right) and a shadow face
// (left) split by a jagged crease, plus a snow cap with a ragged lower edge;
// the near range gets a conifer fringe. Together with the haze gradients in
// AuthMountains this gives the depth of a photographed range.
type Pt = [number, number];
type LayerCfg = { base: number; amp: number; freq: number; sharp: number };
type Terrain = {
  seed: number;
  far: LayerCfg;
  mid: LayerCfg;
  near: LayerCfg;
  /** Peaks higher than this y (smaller y = higher) get a snow cap; 0 = none. */
  snowY: number;
  /** Conifer fringe along the foot of the near range. */
  trees: boolean;
};

const X0 = -10;
const X1 = 430;
const STEP = 4;
const FLOOR = 380;

const TERRAIN: Record<AuthSeason, Terrain> = {
  // Tall, sharp alpine skyline.
  night: {
    seed: 7,
    far: { base: 236, amp: 88, freq: 4, sharp: 1.3 },
    mid: { base: 278, amp: 108, freq: 3, sharp: 1.5 },
    near: { base: 322, amp: 112, freq: 3.5, sharp: 1.6 },
    snowY: 226, trees: true,
  },
  // Denser, more jagged — an icefield.
  winter: {
    seed: 19,
    far: { base: 240, amp: 90, freq: 5, sharp: 1.6 },
    mid: { base: 280, amp: 110, freq: 4, sharp: 1.7 },
    near: { base: 324, amp: 114, freq: 4, sharp: 1.8 },
    snowY: 236, trees: true,
  },
  // Big broad peaks with snow only on the tallest summits.
  spring: {
    seed: 31,
    far: { base: 238, amp: 86, freq: 3.5, sharp: 1.25 },
    mid: { base: 280, amp: 106, freq: 3, sharp: 1.4 },
    near: { base: 324, amp: 108, freq: 3.5, sharp: 1.45 },
    snowY: 214, trees: true,
  },
  // Lower, forested ranges — rounder summits, no snow.
  summer: {
    seed: 43,
    far: { base: 250, amp: 66, freq: 3.5, sharp: 1 },
    mid: { base: 290, amp: 80, freq: 3, sharp: 1.05 },
    near: { base: 330, amp: 84, freq: 2.5, sharp: 1.1 },
    snowY: 0, trees: true,
  },
  autumn: {
    seed: 57,
    far: { base: 250, amp: 68, freq: 4, sharp: 1.05 },
    mid: { base: 290, amp: 82, freq: 3, sharp: 1.1 },
    near: { base: 330, amp: 86, freq: 2.5, sharp: 1.15 },
    snowY: 0, trees: true,
  },
  // Low, lush ridges under cloud.
  monsoon: {
    seed: 71,
    far: { base: 252, amp: 62, freq: 3.5, sharp: 0.9 },
    mid: { base: 292, amp: 74, freq: 3, sharp: 0.95 },
    near: { base: 332, amp: 78, freq: 2.5, sharp: 1 },
    snowY: 0, trees: true,
  },
};

// Multiply each RGB channel of a #rrggbb colour by `k` (0–1) — a shade of
// the same hue, used for the tree line so it reads darker than the rock.
function darken(hex: string, k: number) {
  const ch = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0");
  return `#${ch(1)}${ch(3)}${ch(5)}`;
}

const fmt = (n: number) => Math.round(n * 10) / 10;

// mulberry32 — integer maths only, identical on every JS engine.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(lattice: number[], t: number) {
  const i = Math.floor(t);
  const f = t - i;
  const s = f * f * (3 - 2 * f);
  return lattice[i] + (lattice[i + 1] - lattice[i]) * s;
}

function makeRidge(cfg: LayerCfg, rand: () => number): Pt[] {
  const OCTAVES = 5;
  const lattices: number[][] = [];
  for (let o = 0; o < OCTAVES; o++) {
    const cells = Math.ceil(cfg.freq * Math.pow(2, o));
    lattices.push(Array.from({ length: cells + 2 }, () => rand()));
  }
  const heights: number[] = [];
  const count = Math.round((X1 - X0) / STEP);
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    let h = 0;
    let gain = 1;
    let norm = 0;
    for (let o = 0; o < OCTAVES; o++) {
      const n = valueNoise(lattices[o], u * cfg.freq * Math.pow(2, o));
      h += gain * Math.pow(1 - Math.abs(2 * n - 1), cfg.sharp);
      norm += gain;
      gain *= 0.5;
    }
    heights.push(h / norm);
  }
  // Stretch so each range always spans its full amplitude.
  const lo = Math.min(...heights);
  const hi = Math.max(...heights);
  return heights.map((h, i) => [X0 + i * STEP, cfg.base - (cfg.amp * (h - lo)) / (hi - lo)] as Pt);
}

function findPeaks(pts: Pt[], win: number): number[] {
  const out: number[] = [];
  for (let i = win; i < pts.length - win; i++) {
    let ok = true;
    for (let k = 1; k <= win && ok; k++) {
      if (pts[i - k][1] < pts[i][1] || pts[i + k][1] <= pts[i][1]) ok = false;
    }
    if (ok) out.push(i);
  }
  return out;
}

// Follow the ridge downhill from a peak to the valley floor; a small rise
// (jitter from the fine octaves) doesn't end the descent, a real one does.
function descend(pts: Pt[], i: number, dir: 1 | -1, maxSteps: number): number {
  let best = i;
  for (let s = 1; s <= maxSteps; s++) {
    const n = i + dir * s;
    if (n < 0 || n >= pts.length) break;
    if (pts[n][1] >= pts[best][1]) best = n;
    else if (pts[best][1] - pts[n][1] > 6) break;
  }
  return best;
}

const path = (points: Pt[]) =>
  `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`;

function snowCap(pts: Pt[], i: number, rand: () => number, snowY: number): { lit: string; shade: string } | null {
  const [px, py] = pts[i];
  if (py >= snowY) return null;
  const depth = Math.min(46, Math.max(12, (snowY - py) * 0.9 + 10));
  let l = i;
  let r = i;
  while (i - l < 20 && l > 0 && pts[l - 1][1] < py + depth) l--;
  while (r - i < 20 && r < pts.length - 1 && pts[r + 1][1] < py + depth) r++;
  if (r - l < 4) return null;

  // Ragged lower edge: alternate shallow/deep tongues along the cap.
  const edge: Pt[] = [pts[l]];
  let deep = false;
  for (let k = l + 2; k < r - 1; k += 2) {
    const reach = deep ? 0.82 + rand() * 0.18 : 0.42 + rand() * 0.25;
    edge.push([pts[k][0], Math.max(pts[k][1] + 3, py + depth * reach)]);
    deep = !deep;
  }
  edge.push(pts[r]);

  const mid: Pt = [px, py + depth * 0.7];
  const left: Pt[] = [...pts.slice(l, i + 1), mid, ...edge.filter((e) => e[0] < px).reverse()];
  const right: Pt[] = [...pts.slice(i, r + 1), ...edge.filter((e) => e[0] > px).reverse(), mid];
  return { lit: path(right), shade: path(left) };
}

type LayerArt = { body: string; lit: string; shade: string; gullies: string; snowLit: string; snowShade: string };

// A jagged line running from (x, y) down to the floor — used for the crease
// between a summit's lit and shadow faces and for the gullies at valley
// floors, so no flank edge is ever a straight ruler line.
function ravine(x: number, y: number, rand: () => number, jitter: number): Pt[] {
  const n = 6;
  const out: Pt[] = [];
  for (let k = 1; k <= n; k++) {
    out.push([x + (k === n ? 0 : (rand() - 0.5) * jitter * 2), y + ((FLOOR - y) * k) / n]);
  }
  return out;
}

function buildLayer(cfg: LayerCfg, snowY: number, rand: () => number): LayerArt {
  const pts = makeRidge(cfg, rand);
  const lit: string[] = [];
  const shade: string[] = [];
  const gullies: string[] = [];
  const snowLit: string[] = [];
  const snowShade: string[] = [];

  for (const i of findPeaks(pts, 7)) {
    const [px, py] = pts[i];
    const l = descend(pts, i, -1, 24);
    const r = descend(pts, i, 1, 24);
    if (Math.min(pts[l][1], pts[r][1]) - py < 16) continue;

    // Each flank is bounded by the ridge, a jagged gully down the valley
    // floor, and a jagged crease down from the summit.
    const crease = ravine(px, py, rand, 6).reverse();
    shade.push(path([...pts.slice(l, i + 1).reverse(), ...ravine(pts[l][0], pts[l][1], rand, 5), ...crease]));
    lit.push(path([...pts.slice(i, r + 1), ...ravine(pts[r][0], pts[r][1], rand, 5), ...crease]));

    if (snowY > 0) {
      const cap = snowCap(pts, i, rand, snowY);
      if (cap) {
        snowLit.push(cap.lit);
        snowShade.push(cap.shade);
      }
    }
  }

  // Fine rock texture: thin wedges running down from the ridge, like erosion
  // gullies on a real face.
  for (let i = 2; i < pts.length - 2; i += 2) {
    if (rand() < 0.45) continue;
    const [x, y] = pts[i];
    const len = 12 + rand() * 46;
    const w = 0.8 + rand() * 1.6;
    const lean = (rand() - 0.5) * 8;
    gullies.push(path([[x, y + 1], [x - w + lean, y + len], [x + w + lean, y + len]]));
  }

  return {
    body: path([[X0, FLOOR], ...pts, [X1, FLOOR]]),
    lit: lit.join(""),
    shade: shade.join(""),
    gullies: gullies.join(""),
    snowLit: snowLit.join(""),
    snowShade: snowShade.join(""),
  };
}

// A row of conifers: a sawtooth whose tooth height and baseline drift
// randomly, so no two trees repeat.
function pineRow(baseY: number, drift: number, minH: number, maxH: number, w: number, rand: () => number): string {
  const pts: Pt[] = [[X0, FLOOR]];
  let y = baseY;
  let x = X0;
  pts.push([x, y]);
  while (x < X1) {
    y = Math.min(baseY + drift, Math.max(baseY - drift, y + (rand() - 0.5) * 4));
    const h = minH + rand() * (maxH - minH);
    pts.push([x + w * (0.4 + rand() * 0.2), y - h]);
    x += w;
    pts.push([x, y]);
  }
  pts.push([x, FLOOR]);
  return path(pts);
}

type Scene = { far: LayerArt; mid: LayerArt; near: LayerArt; treesBack: string; treesFront: string };
const SCENES: Partial<Record<AuthSeason, Scene>> = {};

function sceneFor(season: AuthSeason): Scene {
  const cached = SCENES[season];
  if (cached) return cached;
  const t = TERRAIN[season];
  const rand = rng(t.seed);
  const scene: Scene = {
    far: buildLayer(t.far, t.snowY, rand),
    mid: buildLayer(t.mid, t.snowY, rand),
    near: buildLayer(t.near, t.snowY, rand),
    treesBack: t.trees ? pineRow(t.near.base + 6, 6, 9, 20, 8, rand) : "",
    treesFront: t.trees ? pineRow(t.near.base + 26, 5, 13, 26, 10, rand) : "",
  };
  SCENES[season] = scene;
  return scene;
}


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

// Falling rain for the monsoon scene — fixed x position + fixed fall timing
// (not Math.random()) for the same server/client-parity reason as the star
// field and snowflakes above. Each streak loops independently via CSS.
const RAIN_STREAKS = [
  { x: 12, y: 10, duration: 0.7, delay: -0.1 },
  { x: 34, y: 40, duration: 0.8, delay: -0.5 },
  { x: 58, y: 5, duration: 0.65, delay: -0.3 },
  { x: 82, y: 55, duration: 0.9, delay: -0.7 },
  { x: 106, y: 20, duration: 0.75, delay: -0.2 },
  { x: 130, y: 60, duration: 0.85, delay: -0.6 },
  { x: 154, y: 15, duration: 0.7, delay: -0.4 },
  { x: 178, y: 45, duration: 0.95, delay: -0.15 },
  { x: 202, y: 0, duration: 0.8, delay: -0.55 },
  { x: 226, y: 35, duration: 0.68, delay: -0.35 },
  { x: 250, y: 50, duration: 0.9, delay: -0.05 },
  { x: 274, y: 10, duration: 0.77, delay: -0.65 },
  { x: 298, y: 60, duration: 0.83, delay: -0.25 },
  { x: 322, y: 25, duration: 0.72, delay: -0.45 },
  { x: 346, y: 45, duration: 0.88, delay: -0.1 },
  { x: 370, y: 5, duration: 0.66, delay: -0.5 },
  { x: 394, y: 55, duration: 0.92, delay: -0.3 },
  { x: 20, y: 65, duration: 0.78, delay: -0.6 },
  { x: 200, y: 25, duration: 0.7, delay: -0.05 },
  { x: 380, y: 30, duration: 0.8, delay: -0.2 },
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

// One mountain range: haze-faded body, shadow face, sunlit face, snow caps.
function Range({ art, id, p }: { art: LayerArt; id: "far" | "mid" | "near"; p: Palette }) {
  return (
    <>
      <path d={art.body} fill={`url(#lp-body-${id})`} />
      <path d={art.shade} fill="url(#lp-shade)" />
      <path d={art.lit} fill="url(#lp-lit)" />
      <path d={art.gullies} fill="url(#lp-shade)" opacity=".8" />
      {art.snowShade && <path d={art.snowShade} fill={p.snow} opacity={p.snowOpacity * 0.55} />}
      {art.snowLit && <path d={art.snowLit} fill={p.snow} opacity={p.snowOpacity} />}
    </>
  );
}

export function AuthMountains({
  season = "night",
  className = "lp-mountains",
}: {
  season?: AuthSeason;
  /** Defaults to the login-panel positioning class (`.lp-mountains` —
      absolute, masked, sized to `.lp-left`). Callers reusing this scene
      outside that context (e.g. a landing-page hero card) should pass their
      own sizing className instead. */
  className?: string;
}) {
  const p = PALETTES[season];
  const scene = sceneFor(season);
  const t = TERRAIN[season];
  return (
    <svg
      className={className}
      viewBox="0 0 420 380"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lp-shoot-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>

        {/* Each range fades toward the sky at its foot, so the range behind
            shows through the valleys — atmospheric haze. */}
        {(["far", "mid", "near"] as const).map((k) => (
          <linearGradient key={k} id={`lp-body-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p[k]} stopOpacity="1" />
            <stop offset="1" stopColor={p[k]} stopOpacity={k === "near" ? 1 : 0.4} />
          </linearGradient>
        ))}
        <linearGradient id="lp-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sun} stopOpacity=".4" />
          <stop offset=".8" stopColor={p.sun} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lp-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} stopOpacity=".55" />
          <stop offset=".85" stopColor={p.skyTop} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lp-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
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
      ) : p.sky === "storm" ? (
        <>
          {/* the sun, barely visible behind heavy cloud cover */}
          <circle cx="300" cy="90" r="34" fill={p.sun} opacity=".28" />

          {/* thick, low, rolling rain clouds — layered for depth, all in the
              sky's own dark top colour rather than white, since a storm sky
              reads as dark clouds, not bright cartoon puffs */}
          <Cloud x={80} y={90} s={1.7} fill={p.skyTop} opacity={0.38} />
          <Cloud x={230} y={55} s={2} fill={p.skyTop} opacity={0.42} />
          <Cloud x={350} y={100} s={1.5} fill={p.skyTop} opacity={0.34} />
          <Cloud x={150} y={130} s={1.35} fill={p.skyTop} opacity={0.3} />
          <Cloud x={300} y={160} s={1.15} fill={p.skyTop} opacity={0.26} />

          {/* rain, falling continuously */}
          {RAIN_STREAKS.map((r, i) => (
            <line
              key={i}
              x1={r.x} y1={r.y} x2={r.x + 6} y2={r.y + 22}
              stroke={p.accent}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity={p.accentOpacity}
              className="lp-rain"
              style={{
                animationDuration: `${r.duration}s`,
                animationDelay: `${r.delay}s`,
              }}
            />
          ))}

          {/* mist clinging low over the hilltops */}
          <rect x="0" y="195" width="420" height="45" fill="#fff" opacity="0.09" />
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

      <g opacity={p.farOpacity}>
        <Range art={scene.far} id="far" p={p} />
      </g>
      <rect x="0" y={t.mid.base - t.mid.amp * 0.55} width="420" height="70" fill="url(#lp-mist)" />
      <g opacity={p.midOpacity}>
        <Range art={scene.mid} id="mid" p={p} />
      </g>
      <rect x="0" y={t.near.base - t.near.amp * 0.45} width="420" height="70" fill="url(#lp-mist)" />
      <Range art={scene.near} id="near" p={p} />

      {/* conifer fringe along the foot of the near range */}
      {scene.treesBack && <path d={scene.treesBack} fill={darken(p.near, 0.72)} />}
      {scene.treesFront && <path d={scene.treesFront} fill={darken(p.near, 0.52)} />}
    </svg>
  );
}
