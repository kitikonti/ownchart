/**
 * Version constants for the .ownchart file format.
 *
 * - FILE_VERSION: semantic version string written to every saved file.
 *   Bump this whenever the on-disk format changes in a way that requires a
 *   migration step (see fileOperations/migrate.ts).
 *
 * - SCHEMA_VERSION: integer stored in the JSON envelope.
 *   Bump this when the top-level JSON shape changes (added/removed root keys)
 *   so loaders can gate on the integer without parsing the semver string.
 */

/** Semantic version of the .ownchart file format. Bump on breaking changes. */
export const FILE_VERSION = "1.0.0" as const;

/** Integer schema revision stored in the JSON envelope. Bump when root JSON shape changes. */
export const SCHEMA_VERSION = 1 as const;
