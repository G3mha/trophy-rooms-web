"use client";

import { ImageOff } from "lucide-react";
import { AdminImage } from "./admin-image";

interface CoverPreviewProps {
  url: string;
  alt: string;
}

export function CoverPreview({ url, alt }: CoverPreviewProps) {
  if (!url) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-[var(--border-radius)] bg-[var(--bg-secondary)]">
      <AdminImage
        src={url}
        alt={alt}
        className="max-h-[150px] w-full object-contain"
        fallback={
          <div className="flex min-h-[150px] items-center justify-center gap-2 px-4 py-6 text-sm text-[var(--text-muted)]">
            <ImageOff className="size-4 shrink-0" />
            <span>Could not load this cover preview.</span>
          </div>
        }
      />
    </div>
  );
}
