/**
 * Avatar utility functions for generating user initials and colors.
 *
 * Public feeds only carry a user's name and id - never their email - so the id
 * is the fallback seed for unnamed players. It is stable, so a user keeps the
 * same initials and color across renders.
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
 * Generate initials from a user's name, falling back to their id.
 *
 * The fallback reads the END of the id: ids share a common prefix, so leading
 * characters would give every unnamed player the same initials.
 *
 * @example
 * getInitials("John Doe", "clx1a2b3c4d5") // "JD"
 * getInitials(null, "clx1a2b3c4d5") // "D5"
 */
export function getInitials(
  name: string | null | undefined,
  userId: string
): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return userId.slice(-2).toUpperCase();
}

/**
 * Generate a consistent avatar background color based on name or user id.
 *
 * Uses a hash function to deterministically select from a predefined color palette,
 * ensuring the same user always gets the same color.
 */
export function getAvatarColor(
  name: string | null | undefined,
  userId: string
): string {
  const str = name || userId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * The label to show for a user in a public list.
 *
 * Players who have not set a name get a short handle derived from their id
 * rather than anything derived from their email address.
 *
 * @example
 * getDisplayName("John Doe", "clx1a2b3c4d5") // "John Doe"
 * getDisplayName(null, "clx1a2b3c4d5") // "Player 4D5"
 */
export function getDisplayName(
  name: string | null | undefined,
  userId: string
): string {
  return name?.trim() || `Player ${userId.slice(-3).toUpperCase()}`;
}
