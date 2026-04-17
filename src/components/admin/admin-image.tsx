"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";

interface AdminImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback?: React.ReactNode;
}

export function AdminImage({
  src,
  alt = "",
  fallback = null,
  onError,
  ...props
}: AdminImageProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
}
