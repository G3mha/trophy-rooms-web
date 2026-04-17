import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "flex min-h-[132px] w-full rounded-[var(--border-radius)] border border-[color:rgba(255,255,255,0.09)] bg-[rgba(10,10,10,0.55)] px-4 py-3 text-[15px] leading-6 text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,background-color] resize-y placeholder:text-[color:rgba(160,160,160,0.82)] hover:border-[color:rgba(255,255,255,0.16)] focus:outline-none focus:border-[var(--nintendo-red)] focus:bg-[rgba(18,18,18,0.9)] focus:shadow-[0_0_0_3px_rgba(230,0,18,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
