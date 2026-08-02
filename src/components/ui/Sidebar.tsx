"use client";

import * as React from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false, children, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-line bg-[var(--color-sidebar)] transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-[260px]",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex h-[72px] shrink-0 items-center gap-2.5 border-b border-line px-4", className)}>{children}</div>;
}

export function SidebarNav({ className, children }: { className?: string; children: React.ReactNode }) {
  return <nav className={cn("flex-1 overflow-y-auto px-3 py-4", className)}>{children}</nav>;
}

export function SidebarGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {label && <p className="mb-1.5 px-2.5 text-caption font-semibold uppercase tracking-wide text-ink-faint">{label}</p>}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export interface SidebarItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: React.ReactNode;
}

export function SidebarItem({ icon, label, active, collapsed, badge, className, ...props }: SidebarItemProps) {
  return (
    <button
      className={cn(
        "relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
        active ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] text-primary" : "text-ink-muted hover:bg-white hover:text-ink",
        collapsed && "justify-center",
        className
      )}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {active && <span className="absolute left-0 top-1/2 h-4.5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
      <span className="shrink-0 [&>svg]:size-5">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge}
    </button>
  );
}

export function SidebarFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("shrink-0 border-t border-line p-3", className)}>{children}</div>;
}

export function SidebarCollapseButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
      {!collapsed && "Collapse"}
    </button>
  );
}
