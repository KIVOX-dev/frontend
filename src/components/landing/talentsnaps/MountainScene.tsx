"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

// Landscape artwork for the TalentSnaps landing page.
// Pure SVG, no dependencies. Colours are literal so the art stays stable
// even if the CSS tokens change.
//
// Shared between the hero (where it backs the dashboard screenshot) and the
// footer (where it backs the site's closing section). Both crop the same
// tall (1440x840) scene with `xMidYMax slice`, so whichever portion fits the
// container's actual aspect ratio is shown, anchored to the bottom — a short
// container shows mostly meadow/path, a taller one reveals more of the
// peaks. Reusing one detailed scene (rather than a separate short "band"
// asset) is what keeps it from needing an extreme zoom/crop that would
// turn the mountains into flat, distorted color blocks.
export function LandscapeArt({ className = "ts-art" }: { className?: string } = {}) {
  return (
    <svg className={className} viewBox="0 0 1440 840" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A green mountain valley: layered snow capped peaks, forested slopes, meadows and a pale winding path">
        <rect width="1440" height="840" fill="#F6FBF3"/>
        <path d="M0 0 H1440 V196 C 1120 236 900 176 600 216 C 380 246 180 206 0 236 Z" fill="#EDF6E9"/>
        <path d="M0 236 C 220 206 420 246 660 216 C 900 186 1160 236 1440 206 L1440 430 L0 430 Z" fill="#E4F0DF"/>

        {/* far range */}
        <path d="M0 520 L0 360 L70 300 L130 340 L190 268 L250 320 L320 250 L390 318 L450 272 L520 330 L580 286 L650 340 L720 250 L790 322 L860 276 L930 330 L1000 268 L1070 328 L1140 262 L1210 320 L1280 280 L1350 330 L1440 290 L1440 520 Z" fill="#C9DCCB"/>
        {/* mid range */}
        <path d="M0 540 L0 400 L80 330 L150 380 L230 280 L300 350 L380 300 L460 372 L540 316 L620 380 L700 240 L780 356 L850 310 L930 372 L1010 300 L1090 366 L1170 290 L1250 360 L1330 312 L1400 368 L1440 340 L1440 540 Z" fill="#AEC7B2"/>

        {/* left massif */}
        <path d="M-60 560 L60 330 L110 380 L250 120 L330 260 L380 220 L560 560 Z" fill="#728F79"/>
        <path d="M250 120 L330 260 L380 220 L560 560 L300 560 Z" fill="#8CAA93"/>
        <path d="M250 120 L110 380 L60 330 L-60 560 L206 560 Z" fill="#5A7862"/>
        <path d="M250 120 L322 250 L306 238 L292 262 L276 240 L262 266 L246 242 L230 268 L212 244 L196 272 L178 246 L214 178 Z" fill="#F2F9F1"/>
        <path d="M250 120 L264 336 L288 436" fill="none" stroke="#5A7862" strokeWidth="3" opacity=".45"/>

        {/* centre massif, the tall one */}
        <path d="M420 560 L560 300 L610 350 L720 60 L820 240 L880 190 L1040 560 Z" fill="#6A8872"/>
        <path d="M720 60 L820 240 L880 190 L1040 560 L784 560 Z" fill="#84A28C"/>
        <path d="M720 60 L610 350 L560 300 L420 560 L686 560 Z" fill="#52705A"/>
        <path d="M720 60 L806 218 L790 204 L774 232 L756 208 L740 236 L722 210 L704 238 L686 212 L666 240 L648 214 L682 140 Z" fill="#F6FBF5"/>
        <path d="M720 60 L734 300 L760 420" fill="none" stroke="#52705A" strokeWidth="3" opacity=".45"/>

        {/* right massif */}
        <path d="M940 560 L1060 340 L1110 390 L1200 130 L1290 270 L1345 225 L1500 560 Z" fill="#728F79"/>
        <path d="M1200 130 L1290 270 L1345 225 L1500 560 L1252 560 Z" fill="#8CAA93"/>
        <path d="M1200 130 L1110 390 L1060 340 L940 560 L1160 560 Z" fill="#5A7862"/>
        <path d="M1200 130 L1272 258 L1256 246 L1242 270 L1226 248 L1212 274 L1196 250 L1180 276 L1162 252 L1146 280 L1164 186 Z" fill="#F2F9F1"/>
        <path d="M1200 130 L1212 344 L1236 440" fill="none" stroke="#5A7862" strokeWidth="3" opacity=".45"/>

        {/* forested slopes */}
        <path d="M0 560 C 180 500 340 556 520 520 C 700 484 860 540 1040 508 C 1200 480 1340 520 1440 500 L1440 640 L0 640 Z" fill="#43815A"/>
        <path d="M0 604 C 200 564 420 608 640 576 C 860 544 1080 588 1440 556 L1440 680 L0 680 Z" fill="#316E49"/>

        {/* meadows */}
        <path d="M0 650 C 240 616 480 652 720 626 C 960 600 1200 634 1440 610 L1440 840 L0 840 Z" fill="#B9C95E"/>
        <path d="M0 698 C 260 662 520 696 780 670 C 1020 646 1240 676 1440 656 L1440 840 L0 840 Z" fill="#E3D451"/>
        <path d="M0 752 C 280 718 560 750 840 724 C 1080 702 1280 730 1440 712 L1440 840 L0 840 Z" fill="#A8B84A"/>
        <path d="M0 802 C 300 778 600 804 900 786 C 1120 772 1300 790 1440 780 L1440 840 L0 840 Z" fill="#8FA53F"/>

        {/* the path up the valley — tapers to a point within the forested
            slopes above (fill #43815A/#316E49, y≈480-680) instead of
            stopping mid-meadow, so it reads as emerging from the tree line
            at the mountain's base rather than starting from nowhere. */}
        <path d="M262 840 C 300 800 356 776 392 748 C 428 720 430 692 470 670 C 504 646 542 618 566 588 C 582 566 590 540 594 514 C 596 504 597 497 598 491 C 600 499 602 510 604 522 C 608 548 608 576 604 602 C 600 628 578 650 552 670 C 532 684 520 686 520 688 C 484 710 486 734 452 758 C 418 782 362 806 330 840 Z" fill="#DCEAC6"/>
        <path d="M300 840 C 334 806 380 786 410 760 C 440 734 444 708 470 680 C 490 658 508 630 522 602 C 534 580 542 556 548 534 C 550 526 551 520 552 516 C 554 522 556 531 558 541 C 562 561 560 584 552 606 C 540 634 518 658 500 684 C 468 714 466 738 436 764 C 406 790 360 812 334 840 Z" fill="#ECF4DC"/>

        <path d="M1032 800 C 1044 756 1076 724 1106 716 C 1136 708 1158 732 1168 764 C 1176 788 1180 800 1180 804 L1032 804 Z" fill="#B4BCA4"/>
        <path d="M1106 716 C 1136 708 1158 732 1168 764 C 1176 788 1180 800 1180 804 L1128 804 C 1124 770 1116 738 1106 716 Z" fill="#99A388"/>
        <ellipse cx="1000" cy="796" rx="30" ry="15" fill="#B3C29B"/>
      </svg>
  );
}

// Fixed positions + fixed fall timing (not Math.random()) so server and
// client render identical markup — same reasoning as the login screens'
// snowfall/rain (see AuthMountains.tsx). Shared by HeroScene and
// ClosingScene so every monsoon-themed audience page (currently /for-hr)
// gets the same storm atmosphere wherever LandscapeArt appears.
const MONSOON_RAIN = [
  { left: 4, duration: 0.9, delay: -0.1 }, { left: 11, duration: 1.1, delay: -0.6 },
  { left: 18, duration: 0.8, delay: -0.3 }, { left: 25, duration: 1.2, delay: -0.8 },
  { left: 32, duration: 0.95, delay: -0.2 }, { left: 39, duration: 1.05, delay: -0.5 },
  { left: 46, duration: 0.85, delay: -0.4 }, { left: 53, duration: 1.15, delay: -0.15 },
  { left: 60, duration: 0.9, delay: -0.65 }, { left: 67, duration: 1, delay: -0.35 },
  { left: 74, duration: 0.8, delay: -0.05 }, { left: 81, duration: 1.1, delay: -0.7 },
  { left: 88, duration: 0.95, delay: -0.25 }, { left: 95, duration: 1.05, delay: -0.5 },
];

// A dark, low storm-cloud wash plus falling rain, layered over LandscapeArt
// for the monsoon-themed audience pages — same art, different atmosphere,
// rather than a second illustration.
export function MonsoonOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(31,44,42,.55), rgba(31,44,42,.12) 45%, transparent 72%)" }}
      />
      {MONSOON_RAIN.map((r, i) => (
        <span
          key={i}
          className="monsoon-rain-streak"
          style={{ left: `${r.left}%`, animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s` }}
        />
      ))}
      <style jsx>{`
        .monsoon-rain-streak {
          position: absolute;
          top: -10%;
          width: 2px;
          height: 7%;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.6));
          transform: rotate(10deg);
          animation-name: monsoon-rain-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes monsoon-rain-fall {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.7; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function HeroScene({ children, monsoon = false }: { children: ReactNode; monsoon?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Art drifts up a little slower than the page scrolls past it — a subtle
  // depth cue rather than a gimmick, off entirely for reduced-motion users.
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -60]);

  return (
    <div ref={ref} className="ts-scene ts-hero-scene">
      <motion.div style={{ y }} className="ts-hero-scene-art-wrap">
        <LandscapeArt />
        {monsoon && <MonsoonOverlay />}
      </motion.div>
      {children}
    </div>
  );
}
