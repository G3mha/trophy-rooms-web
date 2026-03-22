"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--nintendo-red)] text-white hover:bg-[var(--nintendo-red-dark)] hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-[var(--bg-card)] text-[var(--text-primary)] border-2 border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--switch-light-gray)]",
        outline:
          "bg-transparent text-[var(--text-primary)] border-2 border-[var(--border-color)] hover:border-[var(--nintendo-red)] hover:text-[var(--nintendo-red)]",
        neon: "bg-[var(--switch-neon-blue)] text-[var(--switch-darkest)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]",
        ghost:
          "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]",
        destructive:
          "bg-[var(--switch-neon-red)] text-white hover:bg-[var(--switch-neon-red)]/90",
        link: "text-[var(--nintendo-red)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-5 text-sm rounded-[var(--border-radius)]",
        md: "h-11 px-8 text-base rounded-[var(--border-radius)]",
        lg: "h-12 px-10 text-lg rounded-[var(--border-radius)]",
        icon: "h-10 w-10 rounded-[var(--border-radius)]",
        "icon-sm": "h-7 w-7 rounded-md",
        "icon-xs": "h-6 w-6 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      href,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const content = loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        {children}
      </>
    ) : (
      children
    );

    if (href) {
      return (
        <Link
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
