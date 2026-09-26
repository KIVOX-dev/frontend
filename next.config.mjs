// Origin (scheme+host[:port], no path) the API is actually reached at in
// this build — baked in at build time same as every other NEXT_PUBLIC_* var
// (see Dockerfile's "one image per environment" note). Used below to scope
// CSP's connect-src to the real backend instead of either over-blocking API
// calls or falling back to an unscoped allowance. Unset in local dev
// (src/lib/api.ts's own fallback resolves the API from window.location
// instead), which is fine — these headers are production-only below.
function apiOrigin() {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : null;
  } catch {
    return null;
  }
}

// Security headers, scoped to production only. Not applied in dev/test:
// `next dev`'s HMR websocket and eval-based Fast Refresh would themselves
// violate a CSP strict enough to be worth shipping, and getting this wrong
// in dev would just be a daily annoyance rather than a real protection.
//
// script-src/style-src both need 'unsafe-inline' — Next.js App Router
// streams RSC payloads via inline <script> chunks (a documented constraint;
// the alternative is per-request nonces wired through middleware, not
// attempted here), and this codebase relies extensively on inline
// style={{...}} props throughout, not a CSS-in-JS/nonce setup. Everything
// else here (object-src, frame-ancestors, base-uri, the explicit origin
// allowlists) still meaningfully narrows the attack surface even with those
// two relaxed — see PROJECT_AUDIT_REPORT.md P2-23.
function securityHeaders({ allowEval = false } = {}) {
  const origin = apiOrigin();
  // The chat WebSocket (src/components/shared/PlatformChat.tsx) connects to
  // this same API origin with wss: instead of https:. Browsers are NOT
  // consistent about an https: connect-src source also authorizing the
  // matching wss: connection — Chrome allows it, Firefox/Safari have
  // historically not (https://bugzilla.mozilla.org/show_bug.cgi?id=1345615)
  // — so relying on that implicit upgrade silently breaks the chat socket in
  // some browsers with no visible CSP error, just a connection that never
  // opens. List both schemes explicitly instead of assuming the upgrade.
  const wsOrigin = origin ? origin.replace(/^https:/, "wss:") : null;
  // Cloudflare Turnstile (src/components/auth/Turnstile.tsx) loads
  // api.js from this origin, renders its actual challenge in an iframe
  // from it, and the widget itself calls back to it (token refresh/retry)
  // — needs all three directives or the widget silently fails to render
  // with no visible error (CSP blocks fail closed, not with a console-visible
  // widget error), which is exactly what happened before this was added:
  // the login/register forms required a token from a challenge that CSP
  // never let load in the first place.
  const turnstileOrigin = "https://challenges.cloudflare.com";
  // MediaPipe Tasks Vision (Mock Interviewer's real-time posture detection,
  // src/components/learner/LearnerMockInterview.tsx) loads its WASM runtime
  // from jsdelivr and its pose model file from Google's model store at
  // runtime — neither ships in this app's own bundle.
  const mediapipeCdn = "https://cdn.jsdelivr.net";
  const mediapipeModelStore = "https://storage.googleapis.com";
  // YouTube to Course's video player (CourseViewer.tsx) — the IFrame Player
  // API script (lib/youtubePlayer.ts) is loaded directly into this page, and
  // the player itself is embedded as an iframe pointed at youtube.com, so
  // both script-src and frame-src need it below, not just connect-src.
  const youtubeOrigin = "https://www.youtube.com";
  const connectSrc = [
    "'self'",
    "https://accounts.google.com",
    turnstileOrigin,
    origin,
    wsOrigin,
    mediapipeCdn,
    mediapipeModelStore,
    youtubeOrigin,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // camera/microphone scoped to this app's own origin (not blocked
    // outright) — the Mock Interviewer's compulsory webcam + speech-to-text
    // (LearnerMockInterview.tsx) needs getUserMedia to succeed in production,
    // not just in dev (which ships no Permissions-Policy header at all).
    { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        // html2pdf.js (Resume Builder's Export PDF, src/components/learner/ResumeBuilder.tsx)
        // pulls in jsPDF, which uses eval() internally for font handling —
        // https://github.com/eKoopmans/html2pdf.js/issues/215. Without
        // 'unsafe-eval', that throws immediately in production (CSP isn't
        // applied in dev at all, which is why this went unnoticed locally),
        // and can leave html2canvas's off-screen DOM clone stuck mid-render,
        // which is what actually froze the page — not just the visible
        // error toast. Scoped to allowEval routes only (see headers() below)
        // rather than loosened everywhere, since this weakens CSP's XSS
        // mitigation meaningfully and only one feature, on authenticated
        // dashboard routes, actually needs it.
        //
        // 'wasm-unsafe-eval' (narrower than 'unsafe-eval' — permits only
        // WebAssembly instantiation, not arbitrary eval/Function()) is what
        // MediaPipe's pose-detection WASM runtime needs, applied everywhere
        // rather than only allowEval routes since it can't be abused for JS
        // eval the way 'unsafe-eval' can.
        `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${allowEval ? "'unsafe-eval' " : ""}https://accounts.google.com ${turnstileOrigin} ${mediapipeCdn} ${youtubeOrigin}`,
        "style-src 'self' 'unsafe-inline'",
        // storage.googleapis.com: student-uploaded avatar/cover images (see
        // gcsClient.js — Cloud Run's own filesystem can't persist these).
        // i.ytimg.com/yt3.ggpht.com: YouTube's video/channel thumbnail CDNs
        // (course/lesson thumbnails — see youtubeClient.js#bestThumbnail).
        "img-src 'self' data: https://unavatar.io https://upscaler-ai.com https://via.placeholder.com https://t3.gstatic.com https://storage.googleapis.com https://i.ytimg.com https://yt3.ggpht.com",
        "font-src 'self' data:",
        `connect-src ${connectSrc}`,
        `frame-src https://accounts.google.com ${turnstileOrigin} ${youtubeOrigin}`,
        // MediaPipe's vision task runs its WASM engine off the main thread
        // via a Worker constructed from a jsdelivr-hosted script; falls back
        // to script-src without this, which doesn't cover a cross-origin
        // worker script URL.
        `worker-src 'self' blob: ${mediapipeCdn}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reachable at runtime — what Dockerfile copies into
  // the final stage. Without this the image would need the full dev
  // node_modules tree (~10x larger) just to run `next start`.
  output: "standalone",
  images: {
    // `domains` is deprecated in favor of `remotePatterns` (Next warns on
    // every build otherwise) — same three hosts, just the current config
    // shape. unavatar.io added for CollegeAdminDashboard.tsx's company-logo
    // avatars (dynamic per-company hostname path, e.g. unavatar.io/stripe.com).
    // t3.gstatic.com added because the Vercel Toolbar (shown to logged-in
    // team members viewing their own deployment, not real visitors) fetches
    // a favicon preview from Google's favicon service and routes it through
    // this app's own /_next/image endpoint — without this it 404s.
    remotePatterns: [
      { protocol: "https", hostname: "upscaler-ai.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "unavatar.io" },
      { protocol: "https", hostname: "t3.gstatic.com" },
    ],
  },
  // Both re-enabled: the type error (ResumeBuilder.tsx's html2pdf margin
  // tuple) and lint errors (unescaped quotes, same file) these were hiding
  // are fixed. Build now fails on real type/lint errors again instead of
  // silently shipping them — see git history for what these masked.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Legal pages and troubleshooting guides moved into the docs centre
  // (/docs/{audience}/{slug}); old links, bookmarks and search results land
  // on the new pages.
  async redirects() {
    return [
      { source: "/terms-of-service", destination: "/docs/individuals/terms-and-conditions", permanent: true },
      { source: "/privacy-policy", destination: "/docs/individuals/privacy-policy", permanent: true },
      { source: "/cookie-policy", destination: "/docs/individuals/cookie-policy", permanent: true },
      { source: "/data-protection", destination: "/docs/individuals/data-protection", permanent: true },
      { source: "/troubleshooting", destination: "/docs/individuals/troubleshooting", permanent: true },
      { source: "/for-hr/troubleshooting", destination: "/docs/recruiters/troubleshooting", permanent: true },
      { source: "/for-institutions/troubleshooting", destination: "/docs/institutions/troubleshooting", permanent: true },
      // Docs landing: the Terms, for the audience given (Individuals by default).
      { source: "/docs", destination: "/docs/individuals/terms-and-conditions", permanent: false },
      { source: "/docs/:audience(individuals|institutions|recruiters)", destination: "/docs/:audience/terms-and-conditions", permanent: false },
    ];
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      // Order matters: Next.js applies later matching entries' headers on
      // top of earlier ones for the same key on the same path, so the
      // eval-permitting CSP below must come AFTER the strict default to
      // actually take effect on /learner and /institutional (verified by
      // curling a built server — see the redeploy notes for this change).
      { source: "/:path*", headers: securityHeaders() },
      { source: "/learner/:path*", headers: securityHeaders({ allowEval: true }) },
      { source: "/institutional/:path*", headers: securityHeaders({ allowEval: true }) },
    ];
  },
};

export default nextConfig;
