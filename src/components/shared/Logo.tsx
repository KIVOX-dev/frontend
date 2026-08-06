import Image from "next/image";
import type { CSSProperties } from "react";

type LogoVariant = "primary" | "brand" | "bar" | "mark" | "icon";

// Real dimensions of the trimmed source assets in public/logos/ (and
// app/icon.png for the "icon" variant) — used to derive width from a target
// height so the mark is never stretched.
const VARIANTS: Record<LogoVariant, { src: string; width: number; height: number }> = {
  // Stacked lockup: mark over "UpScaler" wordmark over tagline. Portrait —
  // only fits contexts with real vertical room (footer, docs, big brand
  // sections), never a shallow navbar/sidebar row.
  primary: { src: "/logos/primary-logo.png", width: 751, height: 900 },
  // Horizontal mark + "UpScaler" wordmark, no tagline. The default for any
  // shallow horizontal slot: navbars, expanded sidebars, auth screens.
  brand: { src: "/logos/brand-logo.png", width: 900, height: 269 },
  // Compact horizontal mark + wordmark for the tightest spaces (mobile nav,
  // thin bars) — use via <ResponsiveLogo> rather than directly in most cases.
  bar: { src: "/logos/bar-logo.png", width: 700, height: 186 },
  // Arrow mark only, no text — collapsed sidebar, floating buttons, loaders,
  // decorative watermarks, anywhere text would be too small to read.
  mark: { src: "/logos/logo-mark.png", width: 437, height: 500 },
  // Circular app-icon badge — matches app/icon.png, for the rare in-app
  // spot that wants the literal favicon-shaped mark rather than the bare
  // arrow (e.g. an "install app" prompt).
  icon: { src: "/icon.png", width: 512, height: 512 },
};

export function Logo({
  variant = "brand",
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

// Viewport-responsive brand mark for the landing nav: full horizontal
// lockup on desktop, the more compact bar lockup once the row gets tight,
// down to the bare mark on the narrowest phones. Plain Tailwind breakpoint
// visibility (not a JS matchMedia hook) so there's no hydration mismatch —
// same pattern already used for responsive layout elsewhere in this app.
export function ResponsiveLogo({
  height = 40,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Logo variant="brand" height={height} priority={priority} className={`hidden sm:block ${className ?? ""}`} />
      <Logo variant="bar" height={height} priority={priority} className={`sm:hidden ${className ?? ""}`} />
    </>
  );
}
