"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Whether the field is required (adds asterisk to label) */
  required?: boolean;
  /** Helper text shown below the input */
  hint?: string;
  /** Error message to display */
  error?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** The form input element(s) */
  children: React.ReactNode;
}

/**
 * FormField wraps form inputs with consistent label, hint, and error styling.
 *
 * @example
 * <FormField label="Game Title" required hint="Enter the full game name" error={errors.title}>
 *   <Input value={title} onChange={handleChange} />
 * </FormField>
 */
export function FormField({
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required && " *"}
      </label>
      {children}
      {hint && !error && (
        <span className="text-xs text-[var(--text-muted)]">{hint}</span>
      )}
      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}
