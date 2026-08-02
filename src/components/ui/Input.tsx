import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, required, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-small font-semibold text-ink", className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border bg-white px-3.5 text-base text-ink placeholder:text-ink-faint",
        "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30",
        error ? "border-danger focus:border-danger" : "border-line focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      aria-invalid={!!error || undefined}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-caption text-danger mt-1.5">{children}</p>;
}

export function FieldSuccess({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-caption text-success mt-1.5">{children}</p>;
}

export function Field({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}
