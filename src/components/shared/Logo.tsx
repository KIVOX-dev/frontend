import Image from "next/image";
import type { CSSProperties } from "react";

type LogoVariant = "primary" | "brand" | "bar" | "mark" | "icon";

// Web versions of the official brand files, built from public/logos/ by
// scripts/build-brand-assets.cjs (trimmed, compressed, and with the mark's
// walking figure filled white). Dimensions are used to derive width from a
// target height so the logo is never stretched.
//
// `box`: the share of the requested `height` the artwork itself fills. The
// original lockup files carried a lot of empty padding and every call site
// sized them with that padding included (height={72} drew ~29px of logo), so
// the trimmed lockup keeps that meaning: same visible size, same spacing.
const VARIANTS: Record<LogoVariant, { src: string; width: number; height: number; box?: number }> = {
  // Stacked lockup: mark over "TalentSnaps" wordmark over tagline. Square —
  // only fits contexts with real room (footer, docs, big brand sections),
  // never a shallow navbar/sidebar row.
  primary: { src: "/logos/primary-logo.png", width: 2048, height: 2048 },
  // Horizontal mark + "TalentSnaps" wordmark + tagline. The default for any
  // shallow horizontal slot: navbars, expanded sidebars, auth screens.
  brand: { src: "/brand/lockup.png", width: 1400, height: 308, box: 578 / 1440 },
  // Mark only, square — used at small sizes for the tightest spaces (mobile
  // nav, thin bars) since the full wordmark+tagline lockup isn't legible
  // that small. Use via <ResponsiveLogo> rather than directly in most cases.
  bar: { src: "/brand/mark.png", width: 512, height: 512 },
  // Mark only, no text — collapsed sidebar, floating buttons, loaders,
  // decorative watermarks, anywhere text would be too small to read.
  mark: { src: "/brand/mark.png", width: 512, height: 512 },
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
  const { src, width, height: naturalHeight, box = 1 } = VARIANTS[variant];
  const drawn = Math.round(height * box);
  const computedWidth = Math.round((width / naturalHeight) * drawn);
  const inset = (height - drawn) / 2;

  return (
    <Image
      src={src}
      alt="TalentSnaps"
      width={computedWidth}
      height={drawn}
      priority={priority}
      className={className}
      style={{ height: drawn, width: "auto", ...(inset > 0 ? { marginBlock: inset } : null), ...style }}
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
