import { SyntheticEvent } from "react";

/**
 * Error handler for platform icon images that hides the image on load failure.
 * Use this as the onError handler for platform icon <img> elements.
 *
 * @example
 * <img
 *   src={`/platforms/${platform.slug}.svg`}
 *   alt=""
 *   onError={handlePlatformIconError}
 * />
 */
export function handlePlatformIconError(
  e: SyntheticEvent<HTMLImageElement>
): void {
  e.currentTarget.style.display = "none";
}
