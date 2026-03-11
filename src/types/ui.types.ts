/**
 * Generic option shape for dropdown/select components.
 *
 * `T` is constrained to `string` so the value can be used directly as a
 * React key and compared with `===` without coercion.
 *
 * Lives in `src/types/` rather than inside a component file so that config
 * modules can import it without creating a config → component layer coupling.
 */
export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  /** When true the option is shown but cannot be selected. */
  disabled?: boolean;
}
