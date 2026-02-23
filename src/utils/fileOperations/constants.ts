/**
 * Shared constants for file operations (serialize + deserialize)
 */

/** Known task field names — used to identify/filter unknownFields during round-trip */
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
