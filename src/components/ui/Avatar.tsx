"use client";

import * as React from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-14 text-lg",
};

export function Avatar({ src, alt = "", fallback, size = "default", className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        "inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] font-semibold text-primary",
        sizeClasses[size],
        className
      )}
    >
      <RadixAvatar.Image src={src ?? undefined} alt={alt} className="size-full object-cover" />
      <RadixAvatar.Fallback delayMs={src ? 400 : 0} className="flex items-center justify-center">
        {fallback}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
