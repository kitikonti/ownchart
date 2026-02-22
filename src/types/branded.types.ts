/**
 * Branded and template literal types for compile-time safety.
 *
 * HexColor: Template literal — string literals like "#FF0000" auto-match.
 * PaletteId: Branded type — requires explicit `as PaletteId` from plain strings.
 */

/** Hex color code, e.g. "#FF0000" or "#F00". Template literal type — string literals auto-match. */
export type HexColor = `#${string}`;

/** Color palette identifier. Branded type — requires explicit cast from plain string. */
export type PaletteId = string & { readonly __brand: "PaletteId" };

/** Create a HexColor from a string value (e.g. from a color input element). */
export function toHexColor(value: string): HexColor {
  return value as HexColor;
}

/** Create a PaletteId from a plain string. */
export function toPaletteId(value: string): PaletteId {
  return value as PaletteId;
}
