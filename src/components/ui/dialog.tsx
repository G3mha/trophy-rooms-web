"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[140] bg-black/64 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onEnterKeySubmit,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  onEnterKeySubmit?: () => void;
}) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && onEnterKeySubmit) {
        // Don't submit if focus is on a button (let button handle its own click)
        // or in a textarea (allow newlines)
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "BUTTON" &&
          target.tagName !== "TEXTAREA" &&
          !target.closest("button")
        ) {
          e.preventDefault();
          onEnterKeySubmit();
        }
      }
    },
    [onEnterKeySubmit]
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-[calc(50%+32px)] left-1/2 z-[150] flex max-h-[min(calc(100vh-7rem),960px)] w-[calc(100vw-1.5rem)] max-w-[42rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[calc(var(--border-radius-lg)+2px)] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)),var(--bg-card)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] duration-200 outline-none sm:w-[calc(100vw-3rem)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 h-9 w-9 rounded-full border border-white/8 bg-black/10 p-0 text-[var(--text-secondary)] hover:bg-white/8 hover:text-[var(--text-primary)]"
                size="icon"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "shrink-0 border-b border-white/6 px-5 pt-5 pb-3 sm:px-7 sm:pt-6",
        className
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 overflow-y-auto px-5 py-4 sm:px-7",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "shrink-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(0,0,0,0.12))] flex flex-col-reverse gap-2.5 px-5 py-5 sm:flex-row sm:justify-end sm:px-7 sm:py-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "pr-10 text-xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "mt-1 max-w-[60ch] text-sm leading-6 text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
