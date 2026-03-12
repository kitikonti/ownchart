/**
 * Utility for building Tailwind class name strings from conditional arrays.
 *
 * Accepts a nested array of class name tokens (strings, null, undefined, or false)
 * and returns a single space-joined string with all falsy values removed.
 *
 * @example
 * buildClassNames(
 *   "base-class",
 *   isActive && "active",
 *   [isDisabled ? "disabled" : null, "always-present"],
 * );
 */
export function buildClassNames(
  ...items: (
    | string
    | null
    | undefined
    | false
    | (string | null | undefined | false)[]
  )[]
): string {
  return items
    .flat()
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}
