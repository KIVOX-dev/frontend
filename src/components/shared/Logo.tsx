import Image from "next/image";
import type { CSSProperties } from "react";

type LogoVariant = "full" | "mark" | "icon" | "sidebar";

// Real dimensions of the trimmed source assets in public/logos/ — used to
// derive width from a target height so the mark is never stretched.
const VARIANTS: Record<LogoVariant, { src: string; width: number; height: number }> = {
  // Full lockup: mark + "UpScaler" wordmark + tagline. For larger, roomier
  // placements (auth screens, footer, splash).
  full: { src: "/logos/primary_logo_blue.png", width: 1036, height: 864 },
  // Mark only, no text — for compact header/sidebar slots next to a text label.
  mark: { src: "/logos/icon_mark_blue.png", width: 808, height: 864 },
  // Mark inside a ring, square — for favicon/app-icon-shaped contexts.
  icon: { src: "/logos/app_icon_blue.png", width: 864, height: 864 },
  // Mark + wordmark lockup on its own light card background (self-contained,
  // not transparent) — the "sidebar" asset, also usable standalone in a nav.
  sidebar: { src: "/logos/sidebar_logo_blue.png", width: 1536, height: 837 },
};

export function Logo({
  variant = "full",
  height = 40,
  className,
  priority,
  style,
}: {
  variant?: LogoVariant;
  height?: number;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
}) {
  const { src, width, height: naturalHeight } = VARIANTS[variant];
  const computedWidth = Math.round((width / naturalHeight) * height);

  return (
    <Image
      src={src}
      alt="UpScaler"
      width={computedWidth}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto", ...style }}
    />
  );
}
