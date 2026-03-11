/**
 * General-purpose string hashing utilities.
 *
 * Kept separate from colorUtils.ts so the hash function is reusable in any
 * context — not just color assignment.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DJB2 hash constants
// @see http://www.cse.yorku.ca/~oz/hash.html
// ─────────────────────────────────────────────────────────────────────────────

/** Initial hash value for DJB2 — chosen empirically for low collision rates */
const DJB2_SEED = 5381;
/**
 * Bit-shift amount for DJB2: hash * 33 ≡ (hash << 5) + hash.
 * JavaScript bitwise operators coerce operands to a signed 32-bit integer
 * before the operation, so intermediate values may temporarily be negative.
 * The `& INT31_MASK` applied after the addition strips the sign bit,
 * guaranteeing the final result is always a non-negative integer.
 */
const DJB2_SHIFT = 5;
/** 31-bit mask to ensure stableHash always returns a non-negative integer */
const INT31_MASK = 0x7fffffff;

/**
 * DJB2 hash function — deterministic, stable integer from a string.
 *
 * Typical use: mapping a task ID to a palette index so colors are consistent
 * across renders and sessions.
 *
 * Note: uses charCodeAt (UTF-16 code units). Surrogate pairs in non-BMP
 * strings (e.g. emoji) are hashed as two separate 16-bit units, which still
 * produces a stable, non-negative result.
 *
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
export function stableHash(str: string): number {
  let hash = DJB2_SEED;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << DJB2_SHIFT) + hash + str.charCodeAt(i)) & INT31_MASK;
  }
  return hash;
}
