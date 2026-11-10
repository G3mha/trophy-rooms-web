"use client";

import type { ComponentProps } from "react";
import { AppImage } from "./AppImage";

type PlatformIconProps = Omit<ComponentProps<typeof AppImage>, "src" | "alt" | "title"> & {
  slug: string;
  /**
   * Becomes the alt text and tooltip. Leave it out when text beside the icon
   * already names the platform, or screen readers announce it twice.
   */
  name?: string | null;
};

/** A platform's logo. Shows `fallback`, or nothing, if the image can't load. */
export function PlatformIcon({ slug, name, ...props }: PlatformIconProps) {
  return (
    <AppImage
      {...props}
      src={`/platforms/${slug}.svg`}
      alt={name ?? ""}
      title={name ?? undefined}
    />
  );
}
