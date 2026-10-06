/**
 * Message for a mutation payload that came back with `success: false`.
 * Backend mutations report expected failures (validation, duplicates,
 * permissions) in the payload's `error` rather than as GraphQL errors.
 */
export function getMutationMessage(error?: { message?: string | null } | null) {
  return error?.message || "Something went wrong. Please try again.";
}
