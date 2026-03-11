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

/** Task identifier. Branded type — requires explicit cast from plain string (e.g. at UUID generation or deserialization). */
export type TaskId = string & { readonly __brand: "TaskId" };

/**
 * Create a HexColor from a string value (e.g. from a color input element).
 *
 * @remarks Caller is responsible for passing a valid CSS hex color string
 * (e.g. `"#FF0000"` or `"#F00"`). An invalid string will satisfy the type at
 * compile time but may produce unexpected rendering results at runtime.
 * Browser `<input type="color">` elements always produce valid 7-character hex
 * strings, so they are a safe source without further validation.
 */
export function toHexColor(value: string): HexColor {
  return value as HexColor;
}

/**
 * Create a PaletteId from a plain string.
 *
 * @remarks Caller guarantees the string is a non-empty palette identifier
 * matching one of the entries in the `COLOR_PALETTES` array. Use only at
 * system boundaries (palette definitions, deserialization).
 */
export function toPaletteId(value: string): PaletteId {
  return value as PaletteId;
}

/**
 * Create a TaskId from a plain string.
 *
 * @remarks Use only at system boundaries: UUID generation
 * (`crypto.randomUUID()`) and deserialization. Caller guarantees the string
 * is a valid, non-empty UUID. Do not call with arbitrary user input.
 */
export function toTaskId(value: string): TaskId {
  return value as TaskId;
}
