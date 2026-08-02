"use client";

import * as React from "react";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-4 border-b border-line bg-white/85 px-6 backdrop-blur-md",
        className
      )}
    >
      {children}
    </header>
  );
}

export function NavbarSearch({
  placeholder = "Search…",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      <input
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-line bg-[var(--color-sidebar)] pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
        {...props}
      />
    </div>
  );
}

export function NavbarActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ml-auto flex items-center gap-2", className)}>{children}</div>;
}

export function NavbarNotifications({ count = 0, onClick }: { count?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex size-10 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-tint hover:text-ink"
      aria-label={count > 0 ? `${count} notifications` : "Notifications"}
    >
      <Bell className="size-[18px]" />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger" />
      )}
    </button>
  );
}
