/**
 * Branded and template literal types for compile-time safety.
 *
 * HexColor: Template literal — string literals like "#FF0000" auto-match.
 * PaletteId: Branded type — requires explicit `as PaletteId` from plain strings.
 */

/**
 * Hex color code, e.g. "#FF0000" or "#F00".
 *
 * Template literal type — any string that starts with `#` satisfies this type
 * at compile time. This is a structural hint, not a full CSS hex validator:
 * values like `"#"` or `"#gggggg"` will compile but may produce unexpected
 * rendering. Callers that need strict validation (e.g. deserialization) should
 * apply a regex guard (`/^#[0-9A-Fa-f]{3,8}$/`) before casting via `toHexColor`.
 */
export type HexColor = `#${string}`;

/** Color palette identifier. Branded type — requires explicit cast from plain string. */
export type PaletteId = string & { readonly __brand: "PaletteId" };

/** Task identifier. Branded type — requires explicit cast from plain string (e.g. at UUID generation or deserialization). */
export type TaskId = string & { readonly __brand: "TaskId" };

/**
 * Create a HexColor from a string value (e.g. from a color input element).
 *
 * @remarks Caller is responsible for passing a valid CSS hex color string
 * (e.g. `"#FF0000"` or `"#F00"`). An invalid string (e.g. `"#"` or `"#gggggg"`)
 * will satisfy the `HexColor` type at compile time but may produce unexpected
 * rendering results at runtime. When the source is not a trusted browser
 * `<input type="color">` element, validate before casting:
 * `/^#[0-9A-Fa-f]{3,8}$/.test(value)`. See the `HexColor` JSDoc for details.
 *
 * Browser `<input type="color">` elements always produce valid 7-character hex
 * strings, so they are a safe source without further validation.
 *
 * 8-character hex strings with an alpha channel (e.g. `"#FF0000FF"`) are
 * accepted by the `HexColor` type but may not render correctly in all targets
 * (canvas `fillStyle`, SVG `fill`, or older browsers). Verify compatibility
 * with the intended rendering target before using alpha-channel hex values.
 */
export function toHexColor(value: string): HexColor {
  return value as HexColor;
}

/**
 * Create a PaletteId from a plain string.
 *
 * @remarks Caller guarantees the string is a non-empty palette identifier
 * matching one of the `id` fields in the `COLOR_PALETTES` array (e.g.
 * `"tableau-10"`). Use only at system boundaries: palette constant
 * definitions and deserialization of saved files. Do not call with
 * arbitrary user input without first verifying the value against the
 * known palette list.
 *
 * Deserialization callers MUST validate the string against the known
 * palette list before casting (e.g. `COLOR_PALETTES.some(p => p.id === value)`)
 * to avoid persisting an invalid palette ID into application state.
 *
 * @example
 * // At palette constant definition (trusted source):
 * const id = toPaletteId("tableau-10");
 *
 * // At deserialization (untrusted source — validate first):
 * if (COLOR_PALETTES.some(p => p.id === raw)) {
 *   state.paletteId = toPaletteId(raw);
 * }
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
 *
 * @example
 * // At task creation (trusted UUID source):
 * const id = toTaskId(crypto.randomUUID());
 *
 * // At deserialization (untrusted source — validate format first):
 * if (UUID_REGEX.test(raw)) {
 *   task.id = toTaskId(raw);
 * }
 */
export function toTaskId(value: string): TaskId {
  return value as TaskId;
}
