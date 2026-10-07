"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-[14px] font-semibold " +
    "border-[1.5px] border-transparent bg-no-repeat [background-position:0_100%] [background-size:100%_0] " +
    "transition-[background-size,color,border-color,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      // Landing-page buttons: ink fill that slides to blue on hover (primary),
      // ink outline that slides to ink on hover (secondary).
      variant: {
        primary:
          "bg-[#06262B] border-[#06262B] text-white [background-image:linear-gradient(#0563F9,#0563F9)] " +
          "hover:[background-size:100%_100%] hover:border-[#0563F9]",
        secondary:
          "bg-transparent border-[#06262B] text-[#06262B] [background-image:linear-gradient(#06262B,#06262B)] " +
          "hover:[background-size:100%_100%] hover:text-white",
        ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-paper-tint",
        danger: "bg-danger text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        default: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 p-0",
      },
      // Additive — defaults to the existing rectangular shape used across
      // dashboards, so no call site changes appearance unless it opts in.
      // "pill" is the landing page's shape (full rounded-full CTAs).
      shape: {
        default: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// ── Nested trailing-icon chip ─────────────────────────────────────
// Wraps a button's trailing icon in its own small circular "island"
// instead of letting it float bare next to the label — the icon
// nudges diagonally and scales up on hover for a bit of kinetic
// tension. Pair with a `group` class on the enclosing Button/Link.
export function ButtonIconChip({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
        tone === "light" ? "bg-white/15" : "bg-ink/5",
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
