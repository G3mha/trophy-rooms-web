/**
 * Avatar utility functions for generating user initials and colors.
 */

const AVATAR_COLORS = [
  "#e60012", // Nintendo red
  "#00a651", // Green
  "#0066b3", // Blue
  "#f5a623", // Orange
  "#9b59b6", // Purple
  "#e91e63", // Pink
  "#00bcd4", // Cyan
];

/**
 * Generate initials from a user's name or email.
 *
 * @example
 * getInitials("John Doe", "john@example.com") // "JD"
 * getInitials(null, "john@example.com") // "JO"
 */
export function getInitials(
  name: string | null | undefined,
  email: string
): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent avatar background color based on name or email.
 *
 * Uses a hash function to deterministically select from a predefined color palette,
 * ensuring the same user always gets the same color.
 */
export function getAvatarColor(
  name: string | null | undefined,
  email: string
): string {
  const str = name || email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
