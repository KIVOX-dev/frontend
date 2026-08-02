import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-paper-tint text-ink-muted border border-line",
        success: "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]",
        warning: "bg-[color-mix(in_srgb,var(--color-warning)_14%,white)] text-[var(--color-warning)]",
        danger: "bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]",
        info: "bg-[color-mix(in_srgb,var(--color-info)_12%,white)] text-[var(--color-info)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
