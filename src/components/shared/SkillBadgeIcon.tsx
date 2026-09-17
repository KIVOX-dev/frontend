import Image from "next/image";

// Real designed artwork (public/images/skill-badge.png), not a hand-drawn
// SVG — next/image handles resizing/optimization so this small icon usage
// doesn't ship the full source PNG on every badge instance.
export function SkillBadgeIcon({ className, size = 28 }: { className?: string; size?: number }) {
  return <Image src="/images/skill-badge.png" alt="" width={size} height={size} className={className} unoptimized={false} />;
}
