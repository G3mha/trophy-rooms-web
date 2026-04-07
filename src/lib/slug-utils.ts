/**
 * Generate a URL-friendly slug from a given string.
 *
 * Converts the input to lowercase, removes special characters,
 * replaces spaces with hyphens, and collapses multiple hyphens.
 *
 * @example
 * generateSlug("PlayStation 5") // "playstation-5"
 * generateSlug("The Frozen Wilds!") // "the-frozen-wilds"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
