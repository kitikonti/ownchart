/**
 * Shared constants and type guards for file operations (serialize + deserialize + sanitize)
 */

/**
 * Type guard for plain objects (not null, not array).
 * Centralizes the repeated `typeof x === "object" && x !== null && !Array.isArray(x)` pattern.
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
 * Internal meta-keys used at the serialize/deserialize boundary.
 * These must never leak into the persisted file format.
 * Used by serialize.ts to exclude internal bookkeeping fields from output.
 */
export const INTERNAL_KEYS = new Set(["__unknownFields"]);

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

/**
 * Known dependency field names — used to identify/filter unknownFields during round-trip.
 * Must stay in sync with SerializedDependency fields in types.ts.
 */
export const KNOWN_DEPENDENCY_KEYS = new Set([
  "id",
  "from",
  "to",
  "type",
  "lag",
  "createdAt",
]);

/**
 * Valid column IDs for export selectedColumns filtering.
 * Must stay in sync with hideable column IDs from src/config/tableColumns.ts (TASK_COLUMNS).
 * @see sanitize.test.ts for the sync test that prevents drift.
 */
export const VALID_EXPORT_COLUMNS = new Set([
  "color",
  "name",
  "startDate",
  "endDate",
  "duration",
  "progress",
]);
