"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./campus.css";
import type { CampusAudience } from "./audiences";
import { CampusFooter } from "./CampusFooter";
import { CampusNav } from "./CampusNav";
import { campusFonts } from "./fonts";
import { IconSprite } from "./primitives";

// Scroll feel. Lower lerp = slower, softer catch-up (Lenis default 0.1);
// WHEEL_MULTIPLIER < 1 moves less per wheel notch.
const SCROLL_LERP = 0.055;
const WHEEL_MULTIPLIER = 0.75;
// How long each FAQ question stays open while the list auto-plays.
const FAQ_STEP_MS = 5000;
// Sticky nav height plus a little air.
const NAV_OFFSET = 96;

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

    // Anchors (and keyboard/find-in-page jumps) land below the sticky nav.
    const html = document.documentElement;
    const prevPadding = html.style.scrollPaddingTop;
    html.style.scrollPaddingTop = `${NAV_OFFSET}px`;
    cleanups.push(() => {
      html.style.scrollPaddingTop = prevPadding;
    });

    // Slow, eased scrolling: Lenis smooths the real window scroll (so the
    // scroll listeners, IntersectionObserver and sticky rows below all keep
    // working). Wheel and trackpad only; touch keeps native momentum.
    // Nested scrollers (troubleshooting index, cookie panel) scroll natively.
    if (!reduce) {
      const lenis = new Lenis({ lerp: SCROLL_LERP, wheelMultiplier: WHEEL_MULTIPLIER, smoothWheel: true, allowNestedScroll: true });
      let raf = requestAnimationFrame(function tick(time) {
        lenis.raf(time);
        raf = requestAnimationFrame(tick);
      });
      // Same-page anchor links glide there too. Handled here rather than by
      // Lenis's `anchors` option, which doesn't cancel the browser's own jump.
      const onClick = (e: MouseEvent) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest?.("a[href*='#']") as HTMLAnchorElement | null;
        if (!a) return;
        const url = new URL(a.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        e.preventDefault();
        history.pushState(null, "", url.hash);
        // No offset: Lenis already honours the scroll-padding-top set above.
        lenis.scrollTo(target, { duration: 1.6 });
      };
      document.addEventListener("click", onClick);
      cleanups.push(() => {
        document.removeEventListener("click", onClick);
        cancelAnimationFrame(raf);
        lenis.destroy();
      });
    }

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
    // Reveals are now in this effect's hands; stands down campus.css's
    // time-based failsafe, which only exists for when this never runs.
    root.classList.add("armed");

    // FAQ auto-play: once a FAQ list scrolls into view, open each question in
    // turn for FAQ_STEP_MS, looping. Hover or keyboard focus pauses it;
    // opening a question yourself hands control to you for good. With
    // reduced motion it just opens the first question and stays put.
    root.querySelectorAll<HTMLElement>(".faq").forEach((list) => {
      const items = Array.from(list.querySelectorAll<HTMLDetailsElement>("details"));
      if (items.length < 2) return;
      list.style.setProperty("--faq-step", `${FAQ_STEP_MS}ms`);
      if (!motion) {
        items[0].open = true;
        return;
      }
      let index = -1;
      let timer = 0;
      let stopped = false;
      let paused = false;
      let remaining = FAQ_STEP_MS;
      let startedAt = 0;
      let programmatic = false;

      const show = (i: number) => {
        index = i;
        programmatic = true;
        items.forEach((d, k) => {
          d.open = k === i;
          d.classList.toggle("cycling", k === i);
        });
        // `toggle` fires async; clear the flag after those events have run.
        setTimeout(() => (programmatic = false), 0);
        schedule(FAQ_STEP_MS);
      };
      const schedule = (ms: number) => {
        clearTimeout(timer);
        remaining = ms;
        startedAt = performance.now();
        timer = window.setTimeout(() => show((index + 1) % items.length), ms);
      };
      const pause = () => {
        if (stopped || paused || index < 0) return;
        paused = true;
        clearTimeout(timer);
        remaining -= performance.now() - startedAt;
        list.classList.add("paused");
      };
      const resume = () => {
        if (stopped || !paused) return;
        paused = false;
        list.classList.remove("paused");
        schedule(Math.max(remaining, 400));
      };
      const stop = () => {
        stopped = true;
        clearTimeout(timer);
        items.forEach((d) => d.classList.remove("cycling"));
        list.classList.remove("paused");
      };

      const onToggle = (e: Event) => {
        if (programmatic || index < 0 || stopped) return;
        const auto = items[index];
        stop();
        // You opened a different question: close the one auto-play had open.
        const opened = e.currentTarget as HTMLDetailsElement;
        if (opened.open && opened !== auto) auto.open = false;
      };
      items.forEach((d) => d.addEventListener("toggle", onToggle));
      list.addEventListener("pointerenter", pause);
      list.addEventListener("pointerleave", resume);
      list.addEventListener("focusin", pause);
      list.addEventListener("focusout", (e) => {
        if (!list.contains(e.relatedTarget as Node | null)) resume();
      });

      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting || index >= 0) return;
          io.disconnect();
          show(0);
        },
        { threshold: 0.4 },
      );
      io.observe(list);
      cleanups.push(() => {
        io.disconnect();
        clearTimeout(timer);
        items.forEach((d) => d.removeEventListener("toggle", onToggle));
      });
    });

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
