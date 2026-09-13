// Decorative night-mountain silhouette for AuthSplitLayout's left panel.
// Pure SVG, no dependencies. Blue/navy tones designed specifically for the
// panel's dark gradient background — a night counterpart to the green
// daylight landscape used on the marketing landing page.
export function AuthMountains() {
  return (
    <svg
      className="lp-mountains"
      viewBox="0 0 420 380"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* stars */}
      <circle cx="54" cy="46" r="1.6" fill="#fff" opacity=".55" />
      <circle cx="128" cy="78" r="1.1" fill="#fff" opacity=".35" />
      <circle cx="96" cy="112" r="1.3" fill="#fff" opacity=".4" />
      <circle cx="248" cy="52" r="1.2" fill="#fff" opacity=".3" />
      <circle cx="368" cy="94" r="1.4" fill="#fff" opacity=".4" />
      <circle cx="30" cy="140" r="1.1" fill="#fff" opacity=".3" />

      {/* moon */}
      <circle cx="322" cy="70" r="24" fill="#EAF2FF" opacity=".92" />
      <circle cx="331" cy="62" r="21" fill="#0B408B" opacity=".65" />

      {/* far ridge */}
      <path
        d="M0 220 L45 178 L95 208 L150 158 L205 202 L265 168 L320 206 L375 172 L420 198 L420 380 L0 380 Z"
        fill="#15458F"
        opacity=".55"
      />
      {/* mid ridge */}
      <path
        d="M0 258 L55 214 L115 248 L180 194 L235 244 L295 202 L350 246 L420 220 L420 380 L0 380 Z"
        fill="#0D3272"
        opacity=".8"
      />
      {/* near ridge, with a couple of pale snow caps to echo the landing page's mountains */}
      <path
        d="M0 300 L50 254 L100 284 L165 226 L220 278 L285 236 L345 282 L420 254 L420 380 L0 380 Z"
        fill="#081F4D"
      />
      <path d="M165 226 L178 244 L152 244 Z" fill="#E8F0FF" opacity=".5" />
      <path d="M285 236 L297 253 L273 253 Z" fill="#E8F0FF" opacity=".4" />
    </svg>
  );
}
