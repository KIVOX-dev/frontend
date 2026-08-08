"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Adds standard dialog keyboard behavior to an already-styled, hand-rolled
 * modal — traps Tab focus inside the panel, closes on Escape, moves focus
 * into the panel on open, and restores it to whatever triggered the modal on
 * close. Doesn't render or style anything itself: attach `panelRef` to the
 * modal's visible panel element (not the backdrop) and spread `dialogProps`
 * onto the same element. See components/institutional/StudentTracking.tsx
 * for the reference usage — this exists so every hand-rolled modal in the
 * app doesn't reimplement the same ~30 lines (PROJECT_AUDIT_REPORT.md P2-17).
 */
export function useModalA11y(isOpen: boolean, onClose: () => void, labelId?: string) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const initialFocusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (initialFocusables?.[0] ?? panel)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      triggerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return {
    panelRef,
    dialogProps: {
      role: "dialog" as const,
      "aria-modal": true,
      "aria-labelledby": labelId,
      tabIndex: -1,
    },
  };
}
