"use client";

import * as React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  required?: boolean;
  /** How many matches to show at once. */
  maxItems?: number;
  autoComplete?: string;
  className?: string;
};

// A text input that suggests as you type. Suggestions are only help: anything
// typed is accepted as-is, so a company or town that isn't in the list is never
// blocked. Names that start with what you typed come first, then names that
// merely contain it. Arrow keys move, Enter picks, Escape closes.
export function SuggestInput({ value, onChange, suggestions, placeholder, required, maxItems = 8, autoComplete = "off", className }: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = q
      ? suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      : suggestions;
    const starts = pool.filter((s) => s.toLowerCase().startsWith(q));
    const rest = pool.filter((s) => !s.toLowerCase().startsWith(q));
    return [...starts, ...rest].slice(0, maxItems);
  }, [value, suggestions, maxItems]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const pick = (s: string) => {
    onChange(s);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (matches.length ? (i + 1) % matches.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (matches.length ? (i <= 0 ? matches.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter" && open && active >= 0 && matches[active]) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape" && open) {
      // Close just the list — not the modal this input may be sitting in.
      e.stopPropagation();
      setOpen(false);
    }
  };

  const showList = open && matches.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={className}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg"
        >
          {matches.map((s, i) => (
            <li
              key={s}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the pick lands before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-3.5 py-2 text-base text-ink", i === active && "bg-paper-tint")}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
