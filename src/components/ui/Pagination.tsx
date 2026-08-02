"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== "ellipsis") {
        items.push("ellipsis");
      }
    }
    return items;
  }, [page, pageCount]);

  if (pageCount <= 1) return null;

  return (
    <nav className={cn("flex items-center gap-1.5", className)} aria-label="Pagination">
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1.5 text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded-md text-sm font-semibold transition-colors duration-150",
              item === page ? "bg-primary text-primary-foreground" : "text-ink-muted hover:bg-paper-tint hover:text-ink"
            )}
          >
            {item}
          </button>
        )
      )}

      <Button
        variant="ghost"
        size="icon"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
