"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  title: string;
  description?: string;
  showClose?: boolean;
}

export const ModalContent = React.forwardRef<React.ElementRef<typeof Dialog.Content>, ModalContentProps>(
  ({ className, title, description, showClose = true, children, ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out duration-250" />
      <Dialog.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl bg-white p-6 shadow-modal focus:outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-250",
          className
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-heading-m">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-small mt-1">{description}</Dialog.Description>
            )}
          </div>
          {showClose && (
            <Dialog.Close
              className="rounded-md p-1.5 text-ink-muted hover:bg-paper-tint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close"
            >
              <X className="size-[18px]" />
            </Dialog.Close>
          )}
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
);
ModalContent.displayName = "ModalContent";

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props} />;
}
