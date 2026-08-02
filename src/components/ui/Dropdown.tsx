"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;
export const DropdownGroup = DropdownMenu.Group;
export const DropdownSub = DropdownMenu.Sub;
export const DropdownSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenu.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink outline-none",
      "focus:bg-paper-tint data-[state=open]:bg-paper-tint",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4" />
  </DropdownMenu.SubTrigger>
));
DropdownSubTrigger.displayName = "DropdownSubTrigger";

export const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] rounded-lg border border-line bg-white p-1.5 shadow-dropdown",
        "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 duration-200",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </DropdownMenu.Portal>
));
DropdownContent.displayName = "DropdownContent";

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <DropdownMenu.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors",
      danger ? "text-danger focus:bg-[color-mix(in_srgb,var(--color-danger)_10%,white)]" : "text-ink focus:bg-paper-tint",
      className
    )}
    {...props}
  />
));
DropdownItem.displayName = "DropdownItem";

export const DropdownCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenu.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink outline-none focus:bg-paper-tint",
      className
    )}
    {...props}
  >
    <span className="flex size-4 items-center justify-center">
      <DropdownMenu.ItemIndicator>
        <Check className="size-3.5 text-primary" />
      </DropdownMenu.ItemIndicator>
    </span>
    {children}
  </DropdownMenu.CheckboxItem>
));
DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

export function DropdownLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn("px-2.5 py-1.5 text-caption font-semibold uppercase tracking-wide", className)} {...props} />;
}

export function DropdownSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={cn("my-1.5 h-px bg-line", className)} {...props} />;
}
