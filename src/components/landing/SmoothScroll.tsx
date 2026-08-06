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

    // The dashboard/portal routes (/institutional, /hr, /learner, ...) load
    // legacy-portal.css, which sets an unscoped `html, body { overflow:
    // hidden }` for their own fixed-shell layout. Next doesn't unload that
    // stylesheet on client-side navigation, so once a visitor has opened any
    // dashboard route, that rule stays in the page and silently breaks
    // scrolling everywhere else — including back here. Inline styles beat
    // stylesheet rules regardless of cascade layers, so forcing overflow
    // back to visible here (and only here, cleaned up on unmount below)
    // reclaims scrolling for this page without touching the dashboard CSS
    // that legitimately needs `hidden` for its own shell.
    document.documentElement.style.overflow = "visible";
    document.body.style.overflow = "visible";

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
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
