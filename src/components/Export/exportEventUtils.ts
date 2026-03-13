/**
 * Shared DOM event utilities for Export components.
 * Defined at module level (stable references) to avoid per-render useCallback
 * overhead for handlers that never close over component state.
 */

import type { MouseEvent } from "react";

/**
 * Stops a mouse event from bubbling to ancestor elements.
 * Used to prevent click events from reaching the export dialog's backdrop
 * overlay, which closes the dialog on click. Native <select>, <input>, and
 * <button> elements all fire click events that would otherwise dismiss the dialog.
 */
export function stopPropagation(e: MouseEvent<HTMLElement>): void {
  e.stopPropagation();
}
