"use client";

import { motion } from "framer-motion";

// A headline that tilts up into place (rotateX) rather than just fading —
// the "3D reveal" used across every section title. Wraps existing heading
// markup (including embedded <span className="scale-mark"> highlights and
// <br/> line breaks) unchanged, so no section's heading JSX needs rewriting.
export function RevealHeading({
  as: Tag = "h2",
  children,
  className = "",
  delay = 0,
}: {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const MotionTag = motion[Tag];

  return (
    <MotionTag
      initial={{ opacity: 0, y: 28, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
