import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function LoaderOverlay({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader size={28} />
      <p className="text-small">{label}</p>
    </div>
  );
}
