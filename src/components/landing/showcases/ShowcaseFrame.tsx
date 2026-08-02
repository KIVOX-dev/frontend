"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Search, Bell, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export interface ShowcaseNavItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

export interface ShowcaseFrameProps {
  path: string;
  navItems: ShowcaseNavItem[];
  searchPlaceholder: string;
  userInitials: string;
  showFilter?: boolean;
  children: React.ReactNode;
}

export function ShowcaseFrame({
  path,
  navItems,
  searchPlaceholder,
  userInitials,
  showFilter = true,
  children,
}: ShowcaseFrameProps) {
  return (
    <Card className="p-0 overflow-hidden w-[640px] max-w-[640px] shrink-0">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-[var(--color-sidebar)]">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-primary" />
        </div>
        <div className="flex-1 h-6 rounded-md bg-white border border-line flex items-center px-2.5 min-w-0">
          <span className="text-caption font-mono truncate">app.upscaler.edu{path}</span>
        </div>
      </div>

      <div className="flex h-[560px]">
        {/* Sidebar */}
        <div className="w-[168px] shrink-0 border-r border-line bg-[var(--color-sidebar)] p-2.5 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium ${
                item.active ? "bg-primary/10 text-primary" : "text-ink-muted"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-line shrink-0">
            <div className="flex-1 h-8 rounded-md bg-[var(--color-sidebar)] flex items-center px-2.5 gap-1.5 min-w-0 max-w-xs">
              <Search className="size-3.5 text-ink-faint shrink-0" />
              <span className="text-caption truncate">{searchPlaceholder}</span>
            </div>
            {showFilter && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-caption font-semibold text-ink-muted shrink-0">
                <Filter className="size-3.5" />
                Filters
              </div>
            )}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <div className="relative">
                <Bell className="size-4 text-ink-muted" />
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-danger" />
              </div>
              <Avatar fallback={userInitials} size="sm" className="size-7 text-[11px]" />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function ShowcaseStatCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-md border border-line bg-[var(--color-sidebar)] px-3 py-2.5">
      <p className="text-caption">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-base font-bold text-ink tabular-nums">{value}</p>
        {delta && <span className="text-[10px] font-semibold text-primary">{delta}</span>}
      </div>
    </div>
  );
}

export function ShowcaseBarChart({
  title,
  bars,
}: {
  title: string;
  bars: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-caption font-semibold mb-3">{title}</p>
      <div className="flex gap-2 h-24">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-sm bg-primary/70 transition-all duration-300"
                style={{ height: `${b.value}%` }}
              />
            </div>
            <span className="text-[9px] text-ink-faint">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
