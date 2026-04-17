/**
 * Form validation utilities for consistent validation across the application.
 */

/**
 * Check if a string is a valid HTTP or HTTPS URL.
 *
 * @example
 * isValidHttpUrl("https://example.com/image.jpg") // true
 * isValidHttpUrl("ftp://example.com") // false
 * isValidHttpUrl("not a url") // false
 */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Get Tailwind CSS classes for form field error styling.
 * Returns error border classes when hasError is true.
 *
 * @example
 * <Input className={getFieldErrorClass(Boolean(errors.title))} />
 */
export function getFieldErrorClass(hasError: boolean): string {
  return hasError
    ? "border-red-500 hover:border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]"
    : "";
}
