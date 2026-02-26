/**
 * Shared constants for file operations (serialize + deserialize + sanitize)
 */

/**
 * Keys that could cause prototype pollution if copied to a new object.
 * Used by sanitize.ts (defense-in-depth on incoming data) and
 * serialize.ts (defense-in-depth on outgoing data).
 */
export const DANGEROUS_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/**
 * Known task field names — used to identify/filter unknownFields during round-trip.
 * Must stay in sync with SerializedTask fields in types.ts.
 * @see SKIP_SANITIZE_KEYS in sanitize.ts for the related sanitization skip-set.
 */
export const KNOWN_TASK_KEYS = new Set([
  "id",
  "name",
  "startDate",
  "endDate",
  "duration",
  "progress",
  "color",
  "order",
  "type",
  "parent",
  "open",
  "colorOverride",
  "metadata",
  "createdAt",
  "updatedAt",
]);
