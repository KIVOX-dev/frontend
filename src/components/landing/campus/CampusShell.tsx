"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./campus.css";
import type { CampusAudience } from "./audiences";
import { CampusFooter } from "./CampusFooter";
import { CampusNav } from "./CampusNav";
import { campusFonts } from "./fonts";
import { IconSprite } from "./primitives";

// Everything that fades, rises or draws in when it scrolls into view.
const REVEAL = ".rv,.rows,.path,.chart,.steps4,.rule,.anim,.fword,.tl";

// Shown to no-JS visitors: the root server-renders with .motion (so nothing
// flashes before hydration), which would otherwise leave reveals hidden.
const NO_SCRIPT_CSS = `
.tsl.motion .rv,.tsl.motion .rows > *{opacity:1;transform:none}
.tsl .ln > span,.tsl .fword span{transform:none;opacity:1}
.tsl .pan-bg{clip-path:inset(0 0 0 0)}.tsl .pan-photo{opacity:1}
.tsl.motion .track i,.tsl.motion .fn .bb i{transform:none}
.tsl.motion .drop .ln > span,.tsl.motion .drop .rv:not(.in),.tsl.motion .path .step.rv:not(.in){transform:none}
.tsl.motion .path .step::after{transform:none}
.tsl.motion .path:not(.in) .step .node{background:var(--info-bg);border-color:var(--action);color:var(--accent);transform:none}
.tsl.motion .tl .yr::before,.tsl.motion .tl .yr > h3,.tsl.motion .tl li,.tsl.motion .tl li .ico,.tsl.motion .tl .seal,.tsl.motion .tl .now::after{opacity:1;transform:none}`;

/**
 * Page chrome and motion for the three public landings (/, /for-hr,
 * /for-institutions). Styles live in campus.css, all scoped under .tsl.
 *
 * The effect only adds classes and CSS variables to DOM nodes React
 * rendered; the landing markup is static, so React never re-renders over them.
 */
export function CampusShell({ audience, children }: { audience: CampusAudience; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motion = !reduce && "IntersectionObserver" in window;
    const cleanups: (() => void)[] = [];

    // Anchor links glide, and land below the sticky nav rather than under it.
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    const prevPadding = html.style.scrollPaddingTop;
    if (!reduce) html.style.scrollBehavior = "smooth";
    html.style.scrollPaddingTop = "96px";
    cleanups.push(() => {
      html.style.scrollBehavior = prevBehavior;
      html.style.scrollPaddingTop = prevPadding;
    });

    // Stroke-draw lengths for the institutions chart.
    root.querySelectorAll<SVGPathElement>(".chart path.ln").forEach((p) => {
      p.style.setProperty("--len", String(Math.ceil(p.getTotalLength())));
    });

    if (motion) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          }),
        { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
      );
      root.querySelectorAll(REVEAL).forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    } else {
      root.classList.replace("motion", "no-motion");
      root.querySelectorAll(".path,.steps4,.fword,.chart").forEach((el) => el.classList.add("in"));
    }

    // Shrink the footer wordmark until it fits on one line.
    const fitWords = () => {
      root.querySelectorAll<HTMLElement>(".fword").forEach((f) => {
        f.style.fontSize = "";
        const avail = f.clientWidth;
        const need = f.scrollWidth;
        if (need > avail) f.style.fontSize = `${(parseFloat(getComputedStyle(f).fontSize) * avail * 0.98) / need}px`;
      });
    };
    fitWords();
    document.fonts?.ready.then(fitWords);

    // Product UI rises into its panel as the panel scrolls through view.
    const nav = root.querySelector(".nav");
    const pans = Array.from(root.querySelectorAll<HTMLElement>(".pan-ui, .show-ui"));
    // Footer "curtain": its content trails the scroll and only settles as the
    // page bottoms out, so the last stretch down to the footer reads slow.
    const foot = root.querySelector<HTMLElement>(".sitefoot");
    const parallax = () => {
      nav?.classList.toggle("scrolled", window.scrollY > 8);
      if (reduce) return;
      const vh = window.innerHeight;
      pans.forEach((p) => {
        const top = p.parentElement!.getBoundingClientRect().top;
        const t = Math.max(0, Math.min(1, (vh - top) / (vh * 0.9)));
        const max = p.classList.contains("show-ui") ? 80 : 60;
        p.style.setProperty("--py", `${((1 - t) * max).toFixed(1)}px`);
      });
      if (foot) {
        const r = foot.getBoundingClientRect();
        // 0 as the footer's top edge enters the viewport, 1 once it's fully in
        // (or fills the screen, for footers taller than the viewport).
        const t = Math.max(0, Math.min(1, (vh - r.top) / Math.min(r.height, vh)));
        foot.style.setProperty("--fy", `${((1 - t) * -42).toFixed(1)}%`);
        foot.style.setProperty("--fo", (0.35 + 0.65 * t).toFixed(3));
      }
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        parallax();
      });
    };
    const onResize = () => {
      parallax();
      fitWords();
    };
    parallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={rootRef} className={`tsl motion ${campusFonts}`}>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>
      <IconSprite />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-ink focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <CampusNav audience={audience} />
      <main id="main-content">
        <div className="page">
          <div className="frame">{children}</div>
          <CampusFooter audience={audience} />
        </div>
      </main>
    </div>
  );
}
