import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

export function Loader({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

// Page/section-level loading state — branded with the spinning arrow mark.
// Kept separate from the tiny inline `Loader` above (buttons, small inline
// spinners): a 20px raster brand mark spinning inside every button would be
// blurry and adds real image weight to the most frequently-rendered loading
// indicator in the app, for no visible benefit at that size. This bigger,
// less-frequent "Loading…" block is where the brand mark actually reads.
export function LoaderOverlay({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Logo variant="mark" height={28} className="animate-spin" />
      <p className="text-small">{label}</p>
    </div>
  );
}
