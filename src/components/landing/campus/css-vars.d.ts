import "react";

// Lets inline styles set CSS custom properties (style={{ "--i": 2 }}), which
// the landing theme uses for stagger indices, bar widths and panel colours.
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
