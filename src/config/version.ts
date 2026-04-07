/**
 * Version constants for the .ownchart file format.
 *
 * Bump rules — when in doubt, bump both:
 *
 * - FILE_VERSION (semver string): bump whenever the on-disk format changes in
 *   a way that requires a migration step (see fileOperations/migrate.ts).
 *   Uses semantic versioning: MAJOR for breaking changes, MINOR for additive
 *   changes, PATCH for backward-compatible fixes.
 *
 * - SCHEMA_VERSION (integer): bump when the top-level JSON envelope shape
 *   changes (added/removed root-level keys) so loaders can gate on the integer
 *   without parsing the semver string. Always increment by 1.
 *
 * Both constants may be bumped together when a structural change is made.
 * Neither should ever be decremented.
 */

/** Semantic version of the .ownchart file format. Bump on breaking changes. */
export const FILE_VERSION = "1.0.0" as const;

/**
 * Integer schema revision stored in the JSON envelope.
 * Bump when the top-level JSON shape changes (added/removed root keys).
 * Always increment by 1; never decrement.
 *
 * Revision history:
 *   1 — initial schema (sprint 1.4 dependencies, sprint 1.5.x view settings)
 *   2 — #82 stage 5: lag stored in working days when workingDaysMode is on.
 *       No migration logic was added (lag/dependencies shipped one day before
 *       this work — install base effectively zero), this bump is hygiene only
 *       so a future loader can gate behaviour on the integer if needed.
 */
export const SCHEMA_VERSION = 2 as const;
