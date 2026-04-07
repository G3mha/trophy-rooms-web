"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  icon?: React.ReactNode;
}

const SelectableButton = React.forwardRef<
  HTMLButtonElement,
  SelectableButtonProps
>(({ className, selected, icon, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm text-left rounded-[var(--border-radius)] cursor-pointer transition-colors",
        selected
          ? "bg-[rgba(230,0,18,0.15)] border border-[var(--nintendo-red)]"
          : "bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)]",
        "text-[var(--text-primary)]",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {selected && (
        <Check
          size={16}
          className="shrink-0"
          style={{ color: "var(--nintendo-red)" }}
        />
      )}
    </button>
  );
});

SelectableButton.displayName = "SelectableButton";

export { SelectableButton };
