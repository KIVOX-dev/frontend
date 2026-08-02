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
};

export default nextConfig;
