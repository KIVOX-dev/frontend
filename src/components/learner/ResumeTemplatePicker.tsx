"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export const RESUME_TEMPLATES = [
  { value: "modern", label: "Modern Tech", hint: "Clean, blue accents", accent: "#2563eb", serif: false },
  { value: "classic", label: "Classic Professional", hint: "Traditional serif layout", accent: "#334155", serif: true },
  { value: "minimal", label: "Clean Minimalist", hint: "Plain and spacious", accent: "#94a3b8", serif: false },
  { value: "creative", label: "Creative Bold", hint: "Strong color blocks", accent: "#ea580c", serif: false },
] as const;

/** A tiny page thumbnail in the template's accent color. */
function Swatch({ accent, serif }: { accent: string; serif: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 w-8 h-10 rounded-[5px] border border-slate-200 bg-white flex flex-col gap-[3px] p-[4px]"
    >
      <span className="h-[5px] w-3/4 rounded-sm" style={{ background: accent, opacity: serif ? 0.85 : 1 }} />
      <span className="h-[2px] w-full rounded-sm bg-slate-200" />
      <span className="h-[2px] w-5/6 rounded-sm bg-slate-200" />
      <span className="h-[2px] w-full rounded-sm bg-slate-200" />
      <span className="h-[2px] w-2/3 rounded-sm bg-slate-200" />
    </span>
  );
}

/** Replaces the native <select>: shows each template with a preview swatch and a short description. */
export function ResumeTemplatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(0, RESUME_TEMPLATES.findIndex((t) => t.value === value));
  const selected = RESUME_TEMPLATES[selectedIndex];

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

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % RESUME_TEMPLATES.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + RESUME_TEMPLATES.length) % RESUME_TEMPLATES.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(RESUME_TEMPLATES[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Resume template"
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex items-center gap-2.5 min-w-[210px] pl-2 pr-3 py-1.5 rounded-xl border bg-white text-left transition-colors ${
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Swatch accent={selected.accent} serif={selected.serif} />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-bold text-slate-900 truncate">{selected.label}</span>
          <span className="block text-[11px] text-slate-500 truncate">{selected.hint}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Resume templates"
          className="absolute z-30 left-0 mt-2 w-[290px] max-w-[calc(100vw-2rem)] p-1.5 rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          {RESUME_TEMPLATES.map((t, i) => {
            const isSelected = t.value === value;
            return (
              <li
                key={t.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(t.value)}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer ${
                  i === active ? "bg-slate-100" : ""
                }`}
              >
                <Swatch accent={t.accent} serif={t.serif} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-slate-900">{t.label}</span>
                  <span className="block text-xs text-slate-500">{t.hint}</span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
