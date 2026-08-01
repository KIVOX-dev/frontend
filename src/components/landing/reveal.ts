import type { Transition } from "framer-motion";

/* Shared scroll-reveal used across every landing section below the hero —
   opacity + blur + translate + scale, per the design spec's "Section
   Reveal" motion. Spreads onto a motion.* element via {...revealUp()};
   `whileInView` replaces the manual useRef + useInView + conditional
   `animate` prop every section was reimplementing by hand. */

export const revealEase: Transition["ease"] = [0.16, 1, 0.3, 1];

export const revealUp = (delay = 0, distance = 20) => ({
  initial: { opacity: 0, y: distance, scale: 0.98, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, delay, ease: revealEase },
});
