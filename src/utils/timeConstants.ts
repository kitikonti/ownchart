/**
 * Shared time-related constants.
 *
 * Kept in utils/ so both utility modules and store slices can import from here
 * without creating a cross-layer dependency.
 *
 * Note: taskSliceHelpers.ts exports its own MS_PER_DAY for historical reasons.
 * New code should import from this module instead.
 */

/** Milliseconds in one calendar day. */
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
