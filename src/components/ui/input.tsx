import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full rounded-[var(--border-radius)] border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-base text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--nintendo-red)] focus:ring-2 focus:ring-inset focus:ring-[var(--nintendo-red)]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
