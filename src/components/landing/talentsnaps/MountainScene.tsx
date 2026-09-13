import type { ReactNode } from "react";

// Landscape artwork for the TalentSnaps landing page.
// Pure SVG, no dependencies. Colours are literal so the art stays stable
// even if the CSS tokens change.

export function HeroScene({ children }: { children: ReactNode }) {
  return (
    <div className="scene hero-scene">
      <svg className="art" viewBox="0 0 1440 840" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A green mountain valley: layered snow capped peaks, forested slopes, meadows and a pale winding path">
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

          {/* the path up the valley */}
          <path d="M262 840 C 300 800 356 776 392 748 C 428 720 430 692 470 670 C 510 648 566 642 604 624 L648 634 C 606 656 556 666 520 688 C 484 710 486 734 452 758 C 418 782 362 806 330 840 Z" fill="#DCEAC6"/>
          <path d="M300 840 C 334 806 380 786 410 760 C 440 734 444 708 480 688 L500 694 C 468 714 466 738 436 764 C 406 790 360 812 334 840 Z" fill="#ECF4DC"/>

          <path d="M1032 800 C 1044 756 1076 724 1106 716 C 1136 708 1158 732 1168 764 C 1176 788 1180 800 1180 804 L1032 804 Z" fill="#B4BCA4"/>
          <path d="M1106 716 C 1136 708 1158 732 1168 764 C 1176 788 1180 800 1180 804 L1128 804 C 1124 770 1116 738 1106 716 Z" fill="#99A388"/>
          <ellipse cx="1000" cy="796" rx="30" ry="15" fill="#B3C29B"/>
        </svg>
      {children}
    </div>
  );
}

export function BandScene({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`scene${className ? ` ${className}` : ""}`} style={className ? undefined : { marginTop: 76 }}>
      <svg className="art" viewBox="0 140 1440 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <rect x="0" y="140" width="1440" height="300" fill="#F3F8EE"/>
            <path d="M0 196 C 200 156 420 192 640 166 C 880 138 1140 176 1440 150 L1440 440 L0 440 Z" fill="#E6F1DF"/>
            <path d="M0 240 C 220 202 440 236 660 212 C 900 186 1160 220 1440 196 L1440 440 L0 440 Z" fill="#D2E5C4"/>
            <path d="M0 284 C 240 246 480 282 720 256 C 960 230 1200 264 1440 240 L1440 440 L0 440 Z" fill="#AFCBA2"/>
            <g transform="translate(150 262) scale(0.52 0.52)">
              <path d="M-150 260 L-96 118 L-58 152 L0 0 L46 88 L74 62 L150 260 Z" fill="#AFC7B3"/>
              <path d="M0 0 L46 88 L74 62 L150 260 L44 260 Z" fill="#C3D6C6"/>
              <path d="M0 0 L-58 152 L-96 118 L-150 260 L-46 260 Z" fill="#9FBAA6"/>
              <path d="M0 0 L44 84 L32 74 L21 94 L9 76 L-4 96 L-17 74 L-30 92 L-48 70 Z" fill="#E9F3E9"/>
              <path d="M0 0 L10 160 L26 210" fill="none" stroke="#9FBAA6" strokeWidth="3" opacity=".5"/>
            </g>
            <g transform="translate(20 214) scale(0.72 0.72)">
              <path d="M-150 260 L-96 118 L-58 152 L0 0 L46 88 L74 62 L150 260 Z" fill="#82A189"/>
              <path d="M0 0 L46 88 L74 62 L150 260 L44 260 Z" fill="#9AB59E"/>
              <path d="M0 0 L-58 152 L-96 118 L-150 260 L-46 260 Z" fill="#6E8E77"/>
              <path d="M0 0 L44 84 L32 74 L21 94 L9 76 L-4 96 L-17 74 L-30 92 L-48 70 Z" fill="#EFF7EE"/>
              <path d="M0 0 L10 160 L26 210" fill="none" stroke="#6E8E77" strokeWidth="3" opacity=".5"/>
            </g>
            <g transform="translate(1300 268) scale(-0.5 0.5)">
              <path d="M-150 260 L-96 118 L-58 152 L0 0 L46 88 L74 62 L150 260 Z" fill="#AFC7B3"/>
              <path d="M0 0 L46 88 L74 62 L150 260 L44 260 Z" fill="#C3D6C6"/>
              <path d="M0 0 L-58 152 L-96 118 L-150 260 L-46 260 Z" fill="#9FBAA6"/>
              <path d="M0 0 L44 84 L32 74 L21 94 L9 76 L-4 96 L-17 74 L-30 92 L-48 70 Z" fill="#E9F3E9"/>
              <path d="M0 0 L10 160 L26 210" fill="none" stroke="#9FBAA6" strokeWidth="3" opacity=".5"/>
            </g>
            <g transform="translate(1410 206) scale(-0.76 0.76)">
              <path d="M-150 260 L-96 118 L-58 152 L0 0 L46 88 L74 62 L150 260 Z" fill="#82A189"/>
              <path d="M0 0 L46 88 L74 62 L150 260 L44 260 Z" fill="#9AB59E"/>
              <path d="M0 0 L-58 152 L-96 118 L-150 260 L-46 260 Z" fill="#6E8E77"/>
              <path d="M0 0 L44 84 L32 74 L21 94 L9 76 L-4 96 L-17 74 L-30 92 L-48 70 Z" fill="#EFF7EE"/>
              <path d="M0 0 L10 160 L26 210" fill="none" stroke="#6E8E77" strokeWidth="3" opacity=".5"/>
            </g>
            <path d="M0 322 C 260 286 520 320 780 294 C 1020 270 1240 300 1440 280 L1440 440 L0 440 Z" fill="#B9C95E"/>
            <path d="M0 362 C 280 328 560 360 840 334 C 1080 312 1280 340 1440 322 L1440 440 L0 440 Z" fill="#E3D451"/>
            <path d="M0 404 C 300 380 600 406 900 388 C 1120 374 1300 392 1440 382 L1440 440 L0 440 Z" fill="#A8B84A"/>
            <path d="M262 440 C 300 404 356 384 392 358 C 428 332 430 306 470 286 L520 296 C 484 320 486 344 452 368 C 418 392 362 412 330 440 Z" fill="#DCEAC6"/>
            <path d="M1032 400 C 1044 360 1076 330 1106 322 C 1136 314 1158 338 1168 368 C 1176 392 1180 402 1180 406 L1032 406 Z" fill="#B4BCA4"/>
            <path d="M1106 322 C 1136 314 1158 338 1168 368 C 1176 392 1180 402 1180 406 L1128 406 C 1124 372 1116 342 1106 322 Z" fill="#99A388"/>
          </svg>
      {children}
    </div>
  );
}
