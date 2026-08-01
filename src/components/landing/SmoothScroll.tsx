"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* `root` (not `root={false}`) — Lenis smooths the real document scroll
   rather than wrapping content in its own transformed container. The
   non-root mode traps `position: fixed` to that wrapper (breaking the
   sticky-glass nav) and moves scrolling off `window`, so the nav's
   `window.scrollY` blur-on-scroll listener would never fire. Root mode
   keeps both working exactly as before, just eased.

   This still doesn't touch the dashboard portals — they're separate route
   components that never mount `<SmoothScroll>`, so Lenis only exists while
   this page is; navigating away unmounts it via the effect cleanup below.

   `autoRaf` is off — GSAP's ticker is the single driver, feeding Lenis's
   raf() and telling ScrollTrigger to recompute on every eased scroll tick.
   Two independent RAF loops (Lenis's own + GSAP's) would double-drive the
   scroll math and jank; this is the integration pattern Lenis's own docs
   recommend for GSAP ScrollTrigger specifically. */
function GsapSync() {
  const lenis = useLenis();
  // Navigating to another route (e.g. a login page) and back can restore
  // this page from Next's client-side router cache without re-running
  // mount effects — `lenis` would then still exist, but the GSAP ticker
  // that drives it would have been torn down by the cleanup below when the
  // route was first left, permanently, silently degrading smooth scroll to
  // the browser default ("becomes static"). Including `pathname` forces
  // this effect to re-run on every arrival at this route regardless of
  // whether the underlying component instance was actually remounted.
  const pathname = usePathname();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
    };
  }, [lenis, pathname]);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <GsapSync />
      {children}
    </ReactLenis>
  );
}
