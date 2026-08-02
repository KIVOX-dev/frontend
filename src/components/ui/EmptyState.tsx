import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-6 py-16 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-paper-tint text-ink-faint">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-section-title">{title}</p>
        {description && <p className="text-small max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
