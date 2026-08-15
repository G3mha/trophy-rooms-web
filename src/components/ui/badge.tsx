import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]",
        primary: "bg-[var(--nintendo-red)] text-white",
        secondary:
          "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]",
        outline:
          "bg-transparent text-[var(--text-primary)] border border-[var(--border-color)]",
        // Trophy tiers
        gold: "bg-[var(--switch-gold)] text-[var(--switch-darkest)]",
        silver: "bg-[#C0C0C0] text-[var(--switch-darkest)]",
        bronze: "bg-[#CD7F32] text-[var(--switch-darkest)]",
        // Status variants
        success: "bg-[var(--tint-positive)] text-[var(--switch-darkest)]",
        destructive: "bg-[var(--tint-alert)] text-white",
        info: "bg-[var(--tint-info)] text-[var(--switch-darkest)]",
        // Rarity variants
        common: "bg-[var(--tint-muted)] text-[var(--switch-darkest)]",
        uncommon: "bg-[var(--tint-positive)] text-[var(--switch-darkest)]",
        rare: "bg-[var(--tint-info)] text-[var(--switch-darkest)]",
        epic: "bg-[var(--tint-violet)] text-[var(--switch-darkest)]",
        legendary: "bg-[var(--switch-gold)] text-[var(--switch-darkest)]",
        // Bundle type variants
        bundle: "bg-[var(--nintendo-red)] text-white",
        seasonPass: "bg-[var(--tint-amber)] text-[var(--switch-darkest)]",
        collection: "bg-[var(--switch-gold)] text-[var(--switch-darkest)]",
        subscription: "bg-[var(--tint-violet)] text-[var(--switch-darkest)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
