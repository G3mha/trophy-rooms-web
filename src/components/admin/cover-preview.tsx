"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

interface CoverPreviewProps {
  url: string;
  alt: string;
}

export function CoverPreview({ url, alt }: CoverPreviewProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-[var(--border-radius)] bg-[var(--bg-secondary)]">
      {hasError ? (
        <div className="flex min-h-[150px] items-center justify-center gap-2 px-4 py-6 text-sm text-[var(--text-muted)]">
          <ImageOff className="size-4 shrink-0" />
          <span>Could not load this cover preview.</span>
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          className="max-h-[150px] w-full object-contain"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
