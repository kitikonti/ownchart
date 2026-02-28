/**
 * Test helpers for branded types.
 *
 * Provides shorthand cast functions so test code stays concise while
 * remaining correct if the project ever includes tests/ in tsconfig.
 */

import type { TaskId, HexColor } from "../../src/types/branded.types";

/** Shorthand cast: string → TaskId (for test data). */
export function tid(value: string): TaskId {
  return value as TaskId;
}

/** Shorthand cast: string → HexColor (for test data). */
export function hex(value: string): HexColor {
  return value as HexColor;
}
