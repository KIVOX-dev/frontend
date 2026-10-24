import { Logo } from "@/components/shared/Logo";

// Shown automatically by Next.js while a route segment is loading/navigating
// (App Router's `loading.tsx` convention), and reused by PortalLoading for the
// portal pages' first paint — so this is the one branded loading screen.
//
// It plays our walking-figure animation (public/brand/loading-walk.webp — an
// optimized, cropped copy of the original 17 MB GIF at ~250 KB, so it shows up
// straight away instead of leaving a blank screen while it downloads). People
// who ask their OS to reduce motion get the still logo mark instead.
export default function Loading() {
  return (
    <div className="ts-loading" role="status" aria-live="polite" aria-label="Loading">
      <div className="ts-loading-mark">
        {/* eslint-disable-next-line @next/next/no-img-element -- animated WebP; next/image would flatten it to a still */}
        <img
          className="ts-loading-anim"
          src="/brand/loading-walk.webp"
          alt=""
          width={120}
          height={120}
          decoding="async"
          fetchPriority="high"
        />
        <span className="ts-loading-still">
          <Logo variant="mark" height={64} priority />
        </span>
      </div>
      <p className="ts-loading-word">TalentSnaps</p>

      <style>{`
        .ts-loading {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #ffffff;
        }
        .ts-loading-mark {
          display: grid;
          place-items: center;
          width: 120px;
          height: 120px;
        }
        .ts-loading-anim {
          display: block;
          width: 120px;
          height: 120px;
          object-fit: contain;
        }
        .ts-loading-still { display: none; }
        .ts-loading-word {
          margin: 0;
          font: 700 15px "Inter", system-ui, sans-serif;
          letter-spacing: .02em;
          color: #111827;
          animation: ts-fade 1.1s ease-in-out infinite;
        }
        @keyframes ts-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: .45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ts-loading-anim { display: none; }
          .ts-loading-still { display: block; }
          .ts-loading-word { animation: none; }
        }
      `}</style>
    </div>
  );
}
