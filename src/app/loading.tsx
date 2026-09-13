import { Logo } from "@/components/shared/Logo";

// Shown automatically by Next.js while a route segment is loading/navigating
// (App Router's `loading.tsx` convention) — replaces the previous plain,
// static placeholder with an animated version of our own mark: the walking
// figure "steps" with a soft rhythmic bounce while a ring pulses outward
// behind it, echoing the "moving forward" brand motif instead of a generic
// spinner.
export default function Loading() {
  return (
    <div className="ts-loading">
      <div className="ts-loading-mark">
        <span className="ts-loading-ring" />
        <span className="ts-loading-ring ts-loading-ring--delay" />
        <Logo variant="mark" height={64} priority />
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
          gap: 18px;
          background: #ffffff;
        }
        .ts-loading-mark {
          position: relative;
          display: grid;
          place-items: center;
          width: 96px;
          height: 96px;
        }
        .ts-loading-mark img {
          position: relative;
          z-index: 1;
          animation: ts-step 1.1s cubic-bezier(.45, 0, .2, 1) infinite;
        }
        .ts-loading-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #2f7bf6;
          opacity: 0;
          animation: ts-ping 1.8s cubic-bezier(.2, .6, .35, 1) infinite;
        }
        .ts-loading-ring--delay { animation-delay: .9s; }
        .ts-loading-word {
          margin: 0;
          font: 700 15px "Inter", system-ui, sans-serif;
          letter-spacing: .02em;
          color: #111827;
          animation: ts-fade 1.1s ease-in-out infinite;
        }
        @keyframes ts-step {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(-4deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes ts-ping {
          0% { transform: scale(.6); opacity: .55; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes ts-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: .45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ts-loading-mark img, .ts-loading-ring, .ts-loading-word { animation: none; }
          .ts-loading-ring { display: none; }
        }
      `}</style>
    </div>
  );
}
