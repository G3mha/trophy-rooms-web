"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type FeedbackTone = "success" | "error" | "info";

interface AdminFeedbackProps {
  tone: FeedbackTone;
  message: string;
  className?: string;
}

const toneStyles: Record<FeedbackTone, string> = {
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  error: "border-red-500/30 bg-red-500/10 text-red-100",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-100",
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function AdminFeedback({
  tone,
  message,
  className,
}: AdminFeedbackProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-4 flex items-start gap-3 rounded-[var(--border-radius)] border px-4 py-3 text-sm",
        toneStyles[tone],
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p className="leading-6">{message}</p>
    </div>
  );
}
