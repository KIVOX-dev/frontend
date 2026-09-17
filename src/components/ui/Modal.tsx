"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Thin wrapper around Radix Dialog (already a dependency, unused anywhere
 * else in this codebase until now) — focus trap, Escape-to-close, overlay
 * click-outside, all free. Styled to match the Card/Button design tokens
 * used across src/components/ui rather than the legacy inline-style modals
 * elsewhere in the app (e.g. ResumeBuilder.tsx's own hand-rolled ones).
 */
export function Modal({ open, onOpenChange, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-dropdown",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
            className
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-section-title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-ink-muted hover:text-ink" aria-label="Close">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
