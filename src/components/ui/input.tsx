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
          "flex h-11 w-full rounded-[var(--border-radius)] border border-[color:rgba(255,255,255,0.09)] bg-[rgba(10,10,10,0.55)] px-4 py-2.5 text-[15px] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,background-color] placeholder:text-[color:rgba(160,160,160,0.82)] hover:border-[color:rgba(255,255,255,0.16)] focus:outline-none focus:border-[var(--nintendo-red)] focus:bg-[rgba(18,18,18,0.9)] focus:shadow-[0_0_0_3px_rgba(230,0,18,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
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
