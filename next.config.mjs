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
function securityHeaders() {
  const origin = apiOrigin();
  const connectSrc = ["'self'", "https://accounts.google.com", origin].filter(Boolean).join(" ");

  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://accounts.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://unavatar.io https://upscaler-ai.com https://via.placeholder.com",
        "font-src 'self' data:",
        `connect-src ${connectSrc}`,
        "frame-src https://accounts.google.com",
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
    remotePatterns: [
      { protocol: "https", hostname: "upscaler-ai.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "unavatar.io" },
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
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
